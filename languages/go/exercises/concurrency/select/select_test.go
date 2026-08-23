// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"context"
	"sort"
	"testing"
	"time"
)

func delayed(value string, after time.Duration) <-chan string {
	ch := make(chan string, 1)
	go func() {
		time.Sleep(after)
		ch <- value
	}()
	return ch
}

func TestFirstTakesTheFastest(t *testing.T) {
	got, err := First(context.Background(),
		delayed("slow", 80*time.Millisecond),
		delayed("fast", 5*time.Millisecond),
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "fast" {
		t.Fatalf("got %q", got)
	}
}

func TestCollectGathersCount(t *testing.T) {
	source := make(chan int, 5)
	for i := 1; i <= 5; i++ {
		source <- i * 10
	}

	got, err := Collect(context.Background(), source, 3)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 3 || got[0] != 10 || got[2] != 30 {
		t.Fatalf("got %v", got)
	}
}

func TestMergeCarriesEverything(t *testing.T) {
	a := make(chan int)
	b := make(chan int)
	done := make(chan struct{})
	defer close(done)

	go func() {
		a <- 1
		a <- 3
		close(a)
	}()
	go func() {
		b <- 2
		close(b)
	}()

	var got []int
	for value := range Merge(done, a, b) {
		got = append(got, value)
	}
	sort.Ints(got)
	if len(got) != 3 || got[0] != 1 || got[1] != 2 || got[2] != 3 {
		t.Fatalf("got %v", got)
	}
}
