// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "testing"

func TestLoadReturnsAValue(t *testing.T) {
	value, err := Load(map[string]string{"a": "1"}, "a")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if value != "1" {
		t.Fatalf("got %q, want %q", value, "1")
	}
}

func TestMissingKeyIsReported(t *testing.T) {
	_, err := Load(map[string]string{}, "nope")
	if err == nil {
		t.Fatal("expected an error")
	}
	if !IsMissing(err) {
		t.Fatalf("expected a missing-key error, got %v", err)
	}
}

func TestTheMessageCarriesContext(t *testing.T) {
	_, err := Load(map[string]string{}, "nope")
	want := `load "nope": not found`
	if err.Error() != want {
		t.Fatalf("got %q, want %q", err.Error(), want)
	}
}

func TestLoadAllReturnsEveryValue(t *testing.T) {
	values, err := LoadAll(map[string]string{"a": "1", "b": "2"}, []string{"a", "b"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(values) != 2 || values[0] != "1" || values[1] != "2" {
		t.Fatalf("got %v", values)
	}
}
