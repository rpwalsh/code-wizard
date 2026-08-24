// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"testing"
)

func TestAMapStoreStoresAndReturns(t *testing.T) {
	store := NewMapStore()
	if err := store.Put("a", "one"); err != nil {
		t.Fatalf("put failed: %v", err)
	}

	value, found := store.Get("a")
	if !found || value != "one" {
		t.Fatalf("expected one, got %q (%v)", value, found)
	}
}

func TestAMissingKeyReportsNotFound(t *testing.T) {
	store := NewMapStore()
	value, found := store.Get("missing")
	if found || value != "" {
		t.Fatalf("expected an empty miss, got %q (%v)", value, found)
	}
}

func TestFrozenReadsThrough(t *testing.T) {
	inner := NewMapStore()
	inner.Put("a", "one")

	frozen := Frozen{Inner: inner}
	value, found := frozen.Get("a")
	if !found || value != "one" {
		t.Fatalf("expected the wrapped value, got %q (%v)", value, found)
	}
}

func TestFrozenRefusesWrites(t *testing.T) {
	frozen := Frozen{Inner: NewMapStore()}
	if err := frozen.Put("a", "one"); !errors.Is(err, ErrReadOnly) {
		t.Fatalf("expected ErrReadOnly, got %v", err)
	}
}

func TestFirstFoundTakesTheEarliestHit(t *testing.T) {
	first := NewMapStore()
	second := NewMapStore()
	first.Put("shared", "from first")
	second.Put("shared", "from second")
	second.Put("only", "from second")

	if value, found := FirstFound([]Store{first, second}, "shared"); !found || value != "from first" {
		t.Fatalf("expected the first store to win, got %q", value)
	}
	if value, found := FirstFound([]Store{first, second}, "only"); !found || value != "from second" {
		t.Fatalf("expected a fall through to the second, got %q", value)
	}
}

func TestCanWriteRecognizesTheShapeNotTheBehavior(t *testing.T) {
	if !CanWrite(NewMapStore()) {
		t.Fatal("a map store can write")
	}

	// Frozen has a Put method, so it satisfies Writer — and refuses every
	// write anyway. Satisfying an interface is a fact about shape, not a
	// promise about what the methods do, which is why Put returns an error
	// rather than the type system being expected to express the refusal.
	frozen := Frozen{Inner: NewMapStore()}
	if !CanWrite(frozen) {
		t.Fatal("Frozen has a Put method and therefore satisfies Writer")
	}
	if err := frozen.Put("a", "one"); err == nil {
		t.Fatal("satisfying Writer is not the same as accepting a write")
	}
}
