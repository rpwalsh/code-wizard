// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "testing"

// The table is the lesson: one case per line, and a failure names its row.
func TestParseVersion(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want Version
	}{
		{"plain", "1.22.4", Version{1, 22, 4}},
		{"v prefix", "v2.0.1", Version{2, 0, 1}},
		{"zeros", "0.0.0", Version{0, 0, 0}},
		{"big parts", "10.20.30", Version{10, 20, 30}},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseVersion(tt.in)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestCompareOrdersNumerically(t *testing.T) {
	cases := []struct {
		name string
		a, b string
		want int
	}{
		{"equal", "1.2.3", "1.2.3", 0},
		{"major wins", "2.0.0", "1.99.99", 1},
		{"minor is numeric", "1.10.0", "1.9.0", 1},
		{"patch breaks ties", "1.2.3", "1.2.4", -1},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			a, _ := ParseVersion(tt.a)
			b, _ := ParseVersion(tt.b)
			if got := Compare(a, b); got != tt.want {
				t.Fatalf("Compare(%s, %s) = %d, want %d", tt.a, tt.b, got, tt.want)
			}
		})
	}
}

func TestLatestFindsTheNewest(t *testing.T) {
	got, err := Latest([]string{"1.9.0", "1.10.0", "v1.2.30"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "1.10.0" {
		t.Fatalf("got %q", got)
	}
}
