// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"strings"
	"testing"
)

func TestLoadReturnsNilWhenTheStoreSucceeds(t *testing.T) {
	if err := Load("a", func(string) error { return nil }); err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
}

func TestLoadNamesTheOperation(t *testing.T) {
	err := Load("u_17", func(string) error { return ErrNotFound })
	if err == nil {
		t.Fatal("expected an error")
	}
	if !strings.Contains(err.Error(), "load u_17") {
		t.Fatalf("expected the operation in the message, got %q", err.Error())
	}
}

func TestIsMissingSeesThroughTheWrapper(t *testing.T) {
	err := Load("a", func(string) error { return ErrNotFound })
	if !IsMissing(err) {
		t.Fatal("the sentinel is in the chain and was not found")
	}
}

func TestIsMissingIsFalseForOtherErrors(t *testing.T) {
	err := Load("a", func(string) error { return errors.New("disk on fire") })
	if IsMissing(err) {
		t.Fatal("an unrelated error reported as missing")
	}
}

func TestFieldOfFindsATypedError(t *testing.T) {
	err := Load("a", func(string) error { return &FieldError{Field: "email", Reason: "malformed"} })

	field, ok := FieldOf(err)
	if !ok || field != "email" {
		t.Fatalf("expected email, got %q (%v)", field, ok)
	}
}

func TestFieldOfIsFalseWhenThereIsNone(t *testing.T) {
	if _, ok := FieldOf(Load("a", func(string) error { return ErrNotFound })); ok {
		t.Fatal("found a field error that was never there")
	}
}

func TestFirstReasonReachesTheBottom(t *testing.T) {
	err := Load("a", func(string) error { return ErrNotFound })
	if got := FirstReason(err); got != "not found" {
		t.Fatalf("expected the deepest message, got %q", got)
	}
}
