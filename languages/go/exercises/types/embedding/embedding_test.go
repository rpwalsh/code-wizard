// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"strings"
	"testing"
)

func TestBaseDescribesItself(t *testing.T) {
	b := Base{Name: "core"}
	if got := b.Describe(); got != "BASE:core" {
		t.Fatalf("got %q", got)
	}
}

func TestStampedExtendsTheDescription(t *testing.T) {
	s := Stamped{Base: Base{Name: "api"}, Version: 3}
	if got := s.Describe(); got != "BASE:api@v3" {
		t.Fatalf("got %q", got)
	}
}

func TestPromotedFieldsReadThrough(t *testing.T) {
	s := Stamped{Base: Base{Name: "svc"}, Version: 1}
	// The embedded field's members promote: s.Name is s.Base.Name.
	if s.Name != "svc" {
		t.Fatalf("got %q", s.Name)
	}
}

func TestValidateAcceptsAndRejects(t *testing.T) {
	if err := Validate("ada"); err != nil {
		t.Fatalf("a good name is nil: %v", err)
	}
	err := Validate("")
	if err == nil {
		t.Fatal("an empty name must fail")
	}
	if !strings.Contains(err.Error(), "empty") {
		t.Fatalf("got %q", err.Error())
	}
}

func TestSafelyPassesResultsThrough(t *testing.T) {
	got, err := Safely(func() string { return "fine" })
	if err != nil || got != "fine" {
		t.Fatalf("got %q, %v", got, err)
	}
}
