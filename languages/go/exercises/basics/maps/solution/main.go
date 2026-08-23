// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"sort"
	"strings"
)

// CountWords reports how many times each word appears, lowercased.
func CountWords(text string) map[string]int {
	counts := make(map[string]int)
	for _, word := range strings.Fields(text) {
		// A missing key reads as 0, so the first sighting needs no check.
		counts[strings.ToLower(word)]++
	}
	return counts
}

// Occurrences reports the count and whether the word was ever seen.
// Zero is a real answer here, so absence needs its own channel: the bool.
func Occurrences(counts map[string]int, word string) (int, bool) {
	count, seen := counts[word]
	return count, seen
}

// TopWords lists the limit most frequent words, ties alphabetical.
func TopWords(counts map[string]int, limit int) []string {
	words := make([]string, 0, len(counts))
	for word := range counts {
		words = append(words, word)
	}

	// Map iteration order is deliberately random; this sort is where the
	// function's determinism comes from, not a presentation nicety.
	sort.Slice(words, func(i, j int) bool {
		if counts[words[i]] != counts[words[j]] {
			return counts[words[i]] > counts[words[j]]
		}
		return words[i] < words[j]
	})

	if limit < 0 {
		limit = 0
	}
	if limit > len(words) {
		limit = len(words)
	}
	return words[:limit]
}

func main() {}
