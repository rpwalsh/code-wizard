// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"testing"
)

func TestMapStoreSatisfiesStore(t *testing.T) {
	// The assignment is the assertion: this does not compile unless MapStore
	// has the method, and nothing declares that it does.
	var store Store = MapStore{"a": "1"}

	value, err := store.Get("a")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if value != "1" {
		t.Fatalf("got %q, want %q", value, "1")
	}
}

func TestGetReportsAMissingKey(t *testing.T) {
	_, err := MapStore{}.Get("nope")
	if !errors.Is(err, ErrMissing) {
		t.Fatalf("expected ErrMissing, got %v", err)
	}
}

func TestLookupReturnsEveryValueInOrder(t *testing.T) {
	values, err := Lookup(MapStore{"a": "1", "b": "2"}, []string{"b", "a"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(values) != 2 || values[0] != "2" || values[1] != "1" {
		t.Fatalf("got %v", values)
	}
}

func TestLookupOrSubstitutes(t *testing.T) {
	values := LookupOr(MapStore{"a": "1"}, []string{"a", "nope"}, "-")
	if len(values) != 2 || values[0] != "1" || values[1] != "-" {
		t.Fatalf("got %v", values)
	}
}
