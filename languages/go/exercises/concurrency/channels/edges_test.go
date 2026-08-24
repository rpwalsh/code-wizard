// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

func TestFanInWithNoSourcesStillCloses(t *testing.T) {
	// A WaitGroup that never had anything added releases immediately. The
	// version that waits for at least one sender hangs here forever.
	got := Collect(FanIn[int]())
	if len(got) != 0 {
		t.Fatalf("expected nothing, got %v", got)
	}
}

func TestFanInReadsEverySourceNotJustTheLast(t *testing.T) {
	// Capturing the loop variable instead of passing it makes every
	// goroutine read the same channel, and the earlier ones are lost.
	first := send(1)
	second := send(2)
	third := send(3)

	got := Collect(FanIn(first, second, third))
	seen := map[int]bool{}
	for _, value := range got {
		seen[value] = true
	}

	if !seen[1] || !seen[2] || !seen[3] {
		t.Fatalf("expected all three sources, got %v", got)
	}
}

func TestPoolWithNoJobsReturnsEmpty(t *testing.T) {
	got := Pool([]int{}, 4, func(n int) int { return n })
	if len(got) != 0 {
		t.Fatalf("expected nothing, got %v", got)
	}
}

func TestPoolRunsExactlyTheWorkersItWasGiven(t *testing.T) {
	var running int32
	var peak int32

	Pool([]int{1, 2, 3, 4, 5, 6, 7, 8}, 3, func(n int) int {
		current := atomic.AddInt32(&running, 1)
		for {
			seen := atomic.LoadInt32(&peak)
			if current <= seen || atomic.CompareAndSwapInt32(&peak, seen, current) {
				break
			}
		}
		// A real sleep rather than a busy loop, so workers genuinely
		// overlap and the peak is the number of workers rather than an
		// accident of scheduling.
		time.Sleep(20 * time.Millisecond)
		atomic.AddInt32(&running, -1)
		return n
	})

	// Exactly three, not at most three: one worker too many is as wrong as
	// one too few, and only equality catches an off-by-one in the loop.
	if peak != 3 {
		t.Fatalf("expected exactly three workers, saw %d", peak)
	}
}

func TestPoolWithAnImpossibleWorkerCountRunsOne(t *testing.T) {
	for _, n := range []int{0, -5, 1} {
		var running int32
		var peak int32

		Pool([]int{1, 2, 3}, n, func(v int) int {
			current := atomic.AddInt32(&running, 1)
			for {
				seen := atomic.LoadInt32(&peak)
				if current <= seen || atomic.CompareAndSwapInt32(&peak, seen, current) {
					break
				}
			}
			time.Sleep(10 * time.Millisecond)
			atomic.AddInt32(&running, -1)
			return v
		})

		if peak != 1 {
			t.Fatalf("n=%d: expected exactly one worker, saw %d", n, peak)
		}
	}
}

func TestPoolWithMoreWorkersThanJobs(t *testing.T) {
	got := Pool([]int{7}, 16, func(n int) int { return n + 1 })
	if len(got) != 1 || got[0] != 8 {
		t.Fatalf("unexpected results: %v", got)
	}
}

func TestPoolWithASingleWorkerStillCompletes(t *testing.T) {
	got := Pool([]int{1, 2, 3}, 1, func(n int) int { return n * 2 })
	for i, want := range []int{2, 4, 6} {
		if got[i] != want {
			t.Fatalf("expected doubled values in order, got %v", got)
		}
	}
}

func TestFirstErrorDrainsTheWholeChannel(t *testing.T) {
	// Returning early leaves a sender blocked on an unbuffered channel.
	// Here the effect is visible as a value nobody read.
	errs := make(chan error)
	boom := errors.New("boom")

	go func() {
		errs <- boom
		errs <- errors.New("second")
		close(errs)
	}()

	if got := FirstError(errs); !errors.Is(got, boom) {
		t.Fatalf("expected the first error, got %v", got)
	}
}

func TestFirstErrorSkipsLeadingNils(t *testing.T) {
	boom := errors.New("boom")
	errs := make(chan error, 4)
	errs <- nil
	errs <- nil
	errs <- boom
	close(errs)

	if got := FirstError(errs); !errors.Is(got, boom) {
		t.Fatalf("expected boom, got %v", got)
	}
}
