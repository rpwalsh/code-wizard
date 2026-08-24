// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"fmt"
	"testing"
)

func TestNilIsNotAnError(t *testing.T) {
	if IsMissing(nil) {
		t.Fatal("nil reported as missing")
	}
	if _, ok := FieldOf(nil); ok {
		t.Fatal("nil reported a field")
	}
	if got := FirstReason(nil); got != "" {
		t.Fatalf("expected an empty reason, got %q", got)
	}
}

func TestTheSentinelSurvivesSeveralLayers(t *testing.T) {
	// Four layers deep is ordinary in a real call stack, and == against the
	// outermost error has never been true at any of them.
	deep := fmt.Errorf("handler: %w", fmt.Errorf("service: %w", Load("a", func(string) error {
		return ErrNotFound
	})))

	if !IsMissing(deep) {
		t.Fatal("the sentinel was lost between the layers")
	}
	if deep == ErrNotFound { //nolint:errorlint // the point of the test
		t.Fatal("the outermost error is not the sentinel, and equality should say so")
	}
}

func TestFormattingWithVerbBreaksTheChain(t *testing.T) {
	// %v renders the error into text and discards the value. This is what
	// the exercise is guarding against, shown directly.
	flattened := fmt.Errorf("load: %v", ErrNotFound)

	if errors.Is(flattened, ErrNotFound) {
		t.Fatal("a chain formatted with the value verb should not be walkable")
	}
	if !errors.Is(fmt.Errorf("load: %w", ErrNotFound), ErrNotFound) {
		t.Fatal("a chain wrapped with the wrap verb should be walkable")
	}
}

func TestFieldOfReachesThroughSeveralLayers(t *testing.T) {
	deep := fmt.Errorf("handler: %w", Load("a", func(string) error {
		return &FieldError{Field: "age", Reason: "negative"}
	}))

	field, ok := FieldOf(deep)
	if !ok || field != "age" {
		t.Fatalf("expected age, got %q (%v)", field, ok)
	}
}

func TestFirstReasonOnAnUnwrappedErrorIsItself(t *testing.T) {
	if got := FirstReason(errors.New("alone")); got != "alone" {
		t.Fatalf("expected alone, got %q", got)
	}
}

func TestFirstReasonOnADeepChain(t *testing.T) {
	deep := fmt.Errorf("a: %w", fmt.Errorf("b: %w", fmt.Errorf("c: %w", errors.New("root"))))
	if got := FirstReason(deep); got != "root" {
		t.Fatalf("expected root, got %q", got)
	}
}

func TestLoadPassesTheIdentifierToTheStore(t *testing.T) {
	seen := ""
	Load("wanted", func(id string) error {
		seen = id
		return nil
	})

	if seen != "wanted" {
		t.Fatalf("expected the store to be asked for wanted, got %q", seen)
	}
}
