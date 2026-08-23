// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"fmt"
	"testing"
)

func TestTheCauseSurvivesFurtherWrapping(t *testing.T) {
	_, err := Load(map[string]string{}, "x")
	deeper := fmt.Errorf("starting up: %w", err)
	if !IsMissing(deeper) {
		t.Fatal("the cause did not survive a second layer of wrapping")
	}
}

func TestAnUnrelatedErrorIsNotMissing(t *testing.T) {
	if IsMissing(errors.New("disk on fire")) {
		t.Fatal("an unrelated error was reported as missing")
	}
}

func TestNilIsNotMissing(t *testing.T) {
	if IsMissing(nil) {
		t.Fatal("nil was reported as a missing key")
	}
}

func TestLoadAllStopsAtTheFirstFailure(t *testing.T) {
	_, err := LoadAll(map[string]string{"a": "1"}, []string{"a", "missing", "a"})
	if !IsMissing(err) {
		t.Fatalf("expected the cause to survive, got %v", err)
	}
}

func TestLoadAllOfNothingSucceeds(t *testing.T) {
	values, err := LoadAll(map[string]string{}, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(values) != 0 {
		t.Fatalf("got %v", values)
	}
}
