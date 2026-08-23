// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"strings"
	"testing"
)

func TestTheMalformedTable(t *testing.T) {
	// Adding a rejection case costs one line — so all of them are here.
	cases := []string{
		"", "1.2", "1.2.3.4", "1..3", "a.b.c", "1.2.x",
		"-1.2.3", "1.-2.3", "v", "vv1.2.3", "1.2.3-beta",
	}

	for _, in := range cases {
		t.Run(in, func(t *testing.T) {
			_, err := ParseVersion(in)
			if err == nil {
				t.Fatalf("ParseVersion(%q) should fail", in)
			}
			if !strings.Contains(err.Error(), in) && in != "" {
				t.Fatalf("the error should name the input; got %v", err)
			}
		})
	}
}

func TestLatestFailsOnAnyBadEntry(t *testing.T) {
	_, err := Latest([]string{"1.0.0", "not-a-version", "2.0.0"})
	if err == nil {
		t.Fatal("one bad entry fails the whole call")
	}
	if !strings.Contains(err.Error(), "not-a-version") {
		t.Fatalf("the error should carry the bad entry: %v", err)
	}
}

func TestLatestOfNothingIsAnError(t *testing.T) {
	if _, err := Latest(nil); err == nil {
		t.Fatal("an empty list has no latest")
	}
}

func TestLatestOfOneIsItself(t *testing.T) {
	got, err := Latest([]string{"v3.1.4"})
	if err != nil || got != "v3.1.4" {
		t.Fatalf("got %q, %v", got, err)
	}
}
