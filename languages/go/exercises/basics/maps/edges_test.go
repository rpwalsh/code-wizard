// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"reflect"
	"testing"
)

func TestEmptyTextCountsNothing(t *testing.T) {
	counts := CountWords("")
	if len(counts) != 0 {
		t.Fatalf("nothing to count, got %v", counts)
	}
}

func TestWhitespaceRunsAreOneSeparator(t *testing.T) {
	counts := CountWords("a\t\tb\n\n  a")
	if counts["a"] != 2 || counts["b"] != 1 {
		t.Fatalf("unexpected counts: %v", counts)
	}
	if _, empty := counts[""]; empty {
		t.Fatal("an empty word was counted")
	}
}

func TestOccurrencesOnANilMap(t *testing.T) {
	// A nil map reads as empty; only writing panics.
	count, seen := Occurrences(nil, "anything")
	if count != 0 || seen {
		t.Fatalf("a nil map holds nothing, got %d %v", count, seen)
	}
}

func TestTiesBreakAlphabetically(t *testing.T) {
	counts := map[string]int{"pear": 2, "apple": 2, "fig": 2}
	got := TopWords(counts, 3)
	want := []string{"apple", "fig", "pear"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestLimitBeyondTheMapReturnsEverything(t *testing.T) {
	counts := map[string]int{"a": 1}
	if got := TopWords(counts, 10); len(got) != 1 {
		t.Fatalf("got %v", got)
	}
}

func TestZeroAndNegativeLimitsReturnEmptyNotNil(t *testing.T) {
	counts := map[string]int{"a": 1}
	for _, limit := range []int{0, -3} {
		got := TopWords(counts, limit)
		if got == nil {
			t.Fatalf("limit %d: want an empty slice, got nil", limit)
		}
		if len(got) != 0 {
			t.Fatalf("limit %d: want empty, got %v", limit, got)
		}
	}
}
