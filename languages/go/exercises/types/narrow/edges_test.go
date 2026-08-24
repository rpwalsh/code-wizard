// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "testing"

func TestAFreshStoreIsUsableImmediately(t *testing.T) {
	// A zero-value MapStore has a nil map, and writing to a nil map panics.
	// The constructor exists so the caller never meets that.
	store := NewMapStore()
	if err := store.Put("a", "one"); err != nil {
		t.Fatalf("a fresh store refused a write: %v", err)
	}
}

func TestAnEmptyValueIsStillAHit(t *testing.T) {
	// "" is a value somebody stored. Reporting it as a miss makes the empty
	// string unstorable, which the comma-ok form exists to prevent.
	store := NewMapStore()
	store.Put("blank", "")

	value, found := store.Get("blank")
	if !found {
		t.Fatal("an empty value was reported as missing")
	}
	if value != "" {
		t.Fatalf("expected an empty string, got %q", value)
	}
}

func TestFirstFoundOverNoStoresIsAMiss(t *testing.T) {
	if _, found := FirstFound(nil, "a"); found {
		t.Fatal("found something in no stores at all")
	}
	if _, found := FirstFound([]Store{}, "a"); found {
		t.Fatal("found something in an empty list of stores")
	}
}

func TestFirstFoundSkipsStoresThatMiss(t *testing.T) {
	empty := NewMapStore()
	holding := NewMapStore()
	holding.Put("a", "value")

	if value, found := FirstFound([]Store{empty, empty, holding}, "a"); !found || value != "value" {
		t.Fatalf("expected the third store to answer, got %q (%v)", value, found)
	}
}

func TestFirstFoundReturnsAnEmptyStringItFound(t *testing.T) {
	// The store holds "", so found must be true even though the value is
	// indistinguishable from the zero value returned on a miss.
	holding := NewMapStore()
	holding.Put("a", "")

	value, found := FirstFound([]Store{holding}, "a")
	if !found || value != "" {
		t.Fatalf("expected an empty hit, got %q (%v)", value, found)
	}
}

func TestFrozenCanWrapFrozen(t *testing.T) {
	// Frozen satisfies Store, so it can wrap itself. That is the payoff of
	// the interface being the narrow one the caller actually needs.
	inner := NewMapStore()
	inner.Put("a", "one")

	twice := Frozen{Inner: Frozen{Inner: inner}}
	if value, found := twice.Get("a"); !found || value != "one" {
		t.Fatalf("expected to read through both layers, got %q", value)
	}
	if err := twice.Put("a", "two"); err == nil {
		t.Fatal("a doubly frozen store accepted a write")
	}
}

func TestAWriteAfterFreezingDoesNotReachTheInnerStore(t *testing.T) {
	inner := NewMapStore()
	frozen := Frozen{Inner: inner}
	frozen.Put("a", "sneaked in")

	if _, found := inner.Get("a"); found {
		t.Fatal("the refused write reached the wrapped store anyway")
	}
}
