// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"reflect"
	"testing"
)

func TestCountsEachWord(t *testing.T) {
	counts := CountWords("the cat and the hat")
	if counts["the"] != 2 {
		t.Fatalf("the appears twice, got %d", counts["the"])
	}
	if counts["cat"] != 1 || counts["hat"] != 1 || counts["and"] != 1 {
		t.Fatalf("unexpected counts: %v", counts)
	}
}

func TestCountingIsCaseInsensitive(t *testing.T) {
	counts := CountWords("Go go GO")
	if counts["go"] != 3 {
		t.Fatalf("expected 3 for go, got %d", counts["go"])
	}
	if _, upper := counts["Go"]; upper {
		t.Fatalf("keys should be lowercase, found %q", "Go")
	}
}

func TestOccurrencesDistinguishesZeroFromAbsent(t *testing.T) {
	counts := CountWords("only these words")

	count, seen := Occurrences(counts, "only")
	if count != 1 || !seen {
		t.Fatalf("only was seen once, got %d %v", count, seen)
	}

	count, seen = Occurrences(counts, "never")
	if count != 0 || seen {
		t.Fatalf("never was never seen, got %d %v", count, seen)
	}
}

func TestTopWordsOrdersByFrequency(t *testing.T) {
	counts := CountWords("b b b a a c")
	got := TopWords(counts, 2)
	want := []string{"b", "a"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}
