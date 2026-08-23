// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// Version is a parsed semantic version.
type Version struct {
	Major int
	Minor int
	Patch int
}

// parsePart is unexported on purpose: machinery, not promise. It can
// change shape tomorrow and no consumer can have noticed it exists.
func parsePart(text string) (int, error) {
	if text == "" {
		return 0, fmt.Errorf("empty version part")
	}
	for _, r := range text {
		// Atoi accepts a leading minus; a version part is digits only.
		if r < '0' || r > '9' {
			return 0, fmt.Errorf("not a number: %q", text)
		}
	}
	return strconv.Atoi(text)
}

// ParseVersion parses "1.22.4" or "v1.22.4".
func ParseVersion(text string) (Version, error) {
	trimmed := strings.TrimPrefix(text, "v")
	parts := strings.Split(trimmed, ".")
	if len(parts) != 3 {
		return Version{}, fmt.Errorf("not a version: %q", text)
	}

	numbers := make([]int, 3)
	for i, part := range parts {
		value, err := parsePart(part)
		if err != nil {
			return Version{}, fmt.Errorf("not a version: %q: %w", text, err)
		}
		numbers[i] = value
	}
	return Version{Major: numbers[0], Minor: numbers[1], Patch: numbers[2]}, nil
}

func sign(delta int) int {
	if delta < 0 {
		return -1
	}
	if delta > 0 {
		return 1
	}
	return 0
}

// Compare returns -1, 0 or 1: major first, then minor, then patch.
func Compare(a, b Version) int {
	if a.Major != b.Major {
		return sign(a.Major - b.Major)
	}
	if a.Minor != b.Minor {
		return sign(a.Minor - b.Minor)
	}
	return sign(a.Patch - b.Patch)
}

// Latest returns the newest of the given version strings.
func Latest(texts []string) (string, error) {
	if len(texts) == 0 {
		return "", fmt.Errorf("no versions to compare")
	}

	best := texts[0]
	bestParsed, err := ParseVersion(best)
	if err != nil {
		return "", err
	}

	for _, text := range texts[1:] {
		parsed, err := ParseVersion(text)
		if err != nil {
			return "", err
		}
		if Compare(parsed, bestParsed) > 0 {
			best = text
			bestParsed = parsed
		}
	}
	return best, nil
}

func main() {}
