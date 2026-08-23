// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"strings"
	"testing"
)

func TestTheTypedNilTrapExists(t *testing.T) {
	// Built by hand, on purpose: a nil *NameError placed into the error
	// interface. The pair (type=*NameError, value=nil) is not nil.
	var typed *NameError
	var iface error = typed

	if iface == nil {
		t.Fatal("this is the surprise: the interface is NOT nil")
	}
	if IsReallyNil(iface) {
		t.Fatal("IsReallyNil must agree with the language, not our wishes")
	}
}

func TestValidateSuccessIsInterfaceNil(t *testing.T) {
	// The mirror image: a correct Validate returns the literal nil, and
	// every call-site if err != nil stays quiet.
	if !IsReallyNil(Validate("ada")) {
		t.Fatal("the success path must return the literal nil")
	}
}

func TestSafelyRecoversAPanic(t *testing.T) {
	got, err := Safely(func() string {
		panic("wild library")
	})
	if got != "" {
		t.Fatalf("no result after a panic, got %q", got)
	}
	if err == nil || !strings.Contains(err.Error(), "recovered: wild library") {
		t.Fatalf("got %v", err)
	}
}

func TestSafelyRecoversNonStringPanics(t *testing.T) {
	_, err := Safely(func() string {
		panic(42)
	})
	if err == nil || !strings.Contains(err.Error(), "42") {
		t.Fatalf("got %v", err)
	}
}

func TestShadowingLeavesTheOriginalReachable(t *testing.T) {
	s := Stamped{Base: Base{Name: "x"}, Version: 9}
	// No virtual dispatch: the embedded method is still there, unchanged.
	if got := s.Base.Describe(); got != "BASE:x" {
		t.Fatalf("got %q", got)
	}
}
