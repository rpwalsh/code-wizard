// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"sort"
	"testing"
)

func send(values ...int) <-chan int {
	out := make(chan int, len(values))
	for _, value := range values {
		out <- value
	}
	close(out)
	return out
}

func TestCollectDrainsAChannel(t *testing.T) {
	got := Collect(send(1, 2, 3))
	if len(got) != 3 || got[0] != 1 || got[2] != 3 {
		t.Fatalf("expected 1,2,3 in order, got %v", got)
	}
}

func TestCollectOnAClosedEmptyChannelIsEmpty(t *testing.T) {
	got := Collect(send())
	if len(got) != 0 {
		t.Fatalf("expected nothing, got %v", got)
	}
}

func TestFanInMergesEverySource(t *testing.T) {
	got := Collect(FanIn(send(1, 2), send(3), send(4, 5)))
	sort.Ints(got)

	if len(got) != 5 {
		t.Fatalf("expected five values, got %v", got)
	}
	for i, want := range []int{1, 2, 3, 4, 5} {
		if got[i] != want {
			t.Fatalf("expected 1..5, got %v", got)
		}
	}
}

func TestFanInClosesWhenEverySourceIsDone(t *testing.T) {
	// Collect returns only when the merged channel closes, so returning at
	// all is the assertion.
	_ = Collect(FanIn(send(1), send(2)))
}

func TestPoolKeepsInputOrder(t *testing.T) {
	got := Pool([]int{1, 2, 3, 4}, 3, func(n int) int { return n * 10 })
	for i, want := range []int{10, 20, 30, 40} {
		if got[i] != want {
			t.Fatalf("expected input order, got %v", got)
		}
	}
}

func TestPoolRunsEveryJob(t *testing.T) {
	got := Pool([]string{"a", "b", "c"}, 2, func(s string) string { return s + "!" })
	if len(got) != 3 || got[0] != "a!" || got[2] != "c!" {
		t.Fatalf("unexpected results: %v", got)
	}
}

func TestFirstErrorReportsTheFirstFailure(t *testing.T) {
	boom := errors.New("boom")
	later := errors.New("later")

	errs := make(chan error, 3)
	errs <- nil
	errs <- boom
	errs <- later
	close(errs)

	if got := FirstError(errs); !errors.Is(got, boom) {
		t.Fatalf("expected the first error, got %v", got)
	}
}

func TestFirstErrorIsNilWhenNothingFailed(t *testing.T) {
	errs := make(chan error, 2)
	errs <- nil
	errs <- nil
	close(errs)

	if got := FirstError(errs); got != nil {
		t.Fatalf("expected nil, got %v", got)
	}
}
