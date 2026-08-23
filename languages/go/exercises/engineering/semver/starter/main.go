// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

// Version is a parsed semantic version.
type Version struct {
	Major int
	Minor int
	Patch int
}

// ParseVersion parses "1.22.4" or "v1.22.4".
func ParseVersion(text string) (Version, error) {
	return Version{}, nil
}

// Compare returns -1, 0 or 1: major first, then minor, then patch.
func Compare(a, b Version) int {
	return 0
}

// Latest returns the newest of the given version strings.
func Latest(texts []string) (string, error) {
	return "", nil
}

func main() {}
