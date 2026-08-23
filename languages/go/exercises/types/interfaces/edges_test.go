// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"testing"
)

// failingStore satisfies Store without either type knowing the other exists,
// which is the whole argument for declaring the interface in this package.
type failingStore struct{ err error }

func (f failingStore) Get(string) (string, error) { return "", f.err }

func TestLookupReturnsTheCauseUnchanged(t *testing.T) {
	boom := errors.New("disk on fire")
	_, err := Lookup(failingStore{err: boom}, []string{"a"})
	if !errors.Is(err, boom) {
		t.Fatalf("the cause did not survive: %v", err)
	}
}

func TestLookupOrHidesNoFailure(t *testing.T) {
	// Any error becomes the fallback, because the signature cannot report one.
	values := LookupOr(failingStore{err: errors.New("boom")}, []string{"a"}, "-")
	if len(values) != 1 || values[0] != "-" {
		t.Fatalf("got %v", values)
	}
}

func TestAStoredEmptyStringIsNotMissing(t *testing.T) {
	// The two-value map read is the only thing that tells these apart.
	value, err := MapStore{"a": ""}.Get("a")
	if err != nil {
		t.Fatalf("an empty value is still a value: %v", err)
	}
	if value != "" {
		t.Fatalf("got %q", value)
	}
}

func TestLookingUpNothingSucceeds(t *testing.T) {
	values, err := Lookup(MapStore{}, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(values) != 0 {
		t.Fatalf("got %v", values)
	}
}
