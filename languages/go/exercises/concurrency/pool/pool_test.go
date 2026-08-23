// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"reflect"
	"testing"
)

func TestSquareAllPreservesOrder(t *testing.T) {
	got := SquareAll([]int{1, 2, 3, 4, 5}, 3)
	want := []int{1, 4, 9, 16, 25}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestSquareAllWithOneWorker(t *testing.T) {
	got := SquareAll([]int{3, -3}, 1)
	if !reflect.DeepEqual(got, []int{9, 9}) {
		t.Fatalf("got %v", got)
	}
}

func TestTotalSums(t *testing.T) {
	values := make([]int, 100)
	want := 0
	for i := range values {
		values[i] = i
		want += i
	}
	if got := Total(values, 4); got != want {
		t.Fatalf("got %d, want %d", got, want)
	}
}

func TestPipelineTransformsInOrder(t *testing.T) {
	got := Pipeline([]int{1, 2, 3})
	want := []int{3, 5, 7}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}
