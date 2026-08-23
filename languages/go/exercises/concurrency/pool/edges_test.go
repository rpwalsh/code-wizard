// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"reflect"
	"testing"
)

func TestEmptyInputSpawnsNothingAndReturnsEmpty(t *testing.T) {
	got := SquareAll(nil, 4)
	if got == nil {
		t.Fatal("want an empty slice, got nil")
	}
	if len(got) != 0 {
		t.Fatalf("got %v", got)
	}
	if Total(nil, 4) != 0 {
		t.Fatal("an empty total is 0")
	}
}

func TestZeroWorkersMeansOne(t *testing.T) {
	got := SquareAll([]int{2, 4}, 0)
	if !reflect.DeepEqual(got, []int{4, 16}) {
		t.Fatalf("got %v", got)
	}
	if Total([]int{1, 2, 3}, -2) != 6 {
		t.Fatal("negative workers should clamp to one")
	}
}

func TestMoreWorkersThanJobs(t *testing.T) {
	got := SquareAll([]int{5}, 16)
	if !reflect.DeepEqual(got, []int{25}) {
		t.Fatalf("got %v", got)
	}
	if Total([]int{7}, 50) != 7 {
		t.Fatal("one value, many workers")
	}
}

func TestPipelineOfNothing(t *testing.T) {
	got := Pipeline(nil)
	if len(got) != 0 {
		t.Fatalf("got %v", got)
	}
}

func TestALargeRunFinishes(t *testing.T) {
	// A missing close presents as a hang; the test runner's timeout is the
	// detector. 10k jobs also shakes out index races.
	values := make([]int, 10000)
	for i := range values {
		values[i] = i % 100
	}
	got := SquareAll(values, 8)
	for i, value := range got {
		expected := (i % 100) * (i % 100)
		if value != expected {
			t.Fatalf("index %d: got %d, want %d", i, value, expected)
		}
	}
}
