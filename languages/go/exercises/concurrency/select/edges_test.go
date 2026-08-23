// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestFirstHonorsTheDeadline(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()

	never := make(chan string)
	_, err := First(ctx, never)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("want DeadlineExceeded, got %v", err)
	}
}

func TestFirstWithNoSourcesStillTimesOut(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()
	_, err := First(ctx)
	if err == nil {
		t.Fatal("no sources must still respect the context")
	}
}

func TestCollectReturnsPartialWorkOnCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	source := make(chan int, 2)
	source <- 1
	source <- 2

	go func() {
		time.Sleep(20 * time.Millisecond)
		cancel()
	}()

	got, err := Collect(ctx, source, 10)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("want Canceled, got %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("the work already done comes back; got %v", got)
	}
}

func TestCollectStopsAtAClosedSourceWithoutError(t *testing.T) {
	source := make(chan int, 1)
	source <- 7
	close(source)

	got, err := Collect(context.Background(), source, 5)
	if err != nil {
		t.Fatalf("a closed stream is the normal end: %v", err)
	}
	if len(got) != 1 || got[0] != 7 {
		t.Fatalf("got %v", got)
	}
}

func TestMergeStopsWhenDoneCloses(t *testing.T) {
	// A source that never closes; only done can end the merge.
	stubborn := make(chan int)
	go func() {
		for i := 0; ; i++ {
			stubborn <- i
		}
	}()

	done := make(chan struct{})
	out := Merge(done, stubborn)

	<-out
	<-out
	close(done)

	// The output must close soon after; ranging to the end must not hang.
	deadline := time.After(2 * time.Second)
	for {
		select {
		case _, ok := <-out:
			if !ok {
				return
			}
		case <-deadline:
			t.Fatal("merge did not stop after done closed")
		}
	}
}
