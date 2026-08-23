// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"fmt"
)

// ErrMissing is the identity a caller tests for, rather than a message they
// match on.
var ErrMissing = errors.New("missing")

// Store is declared here, in the package that consumes it, so the
// implementation depends on nothing. Anything with this method is already a
// Store — including a test double that always fails.
type Store interface {
	Get(key string) (string, error)
}

// MapStore is a Store and never says so.
type MapStore map[string]string

// Get returns the value, or ErrMissing. The two-value map read is the only way
// to tell an absent key from a stored empty string.
func (s MapStore) Get(key string) (string, error) {
	value, ok := s[key]
	if !ok {
		return "", fmt.Errorf("get %q: %w", key, ErrMissing)
	}
	return value, nil
}

// Lookup stops at the first failure and returns that error untouched: wrapping
// it again here would add a layer saying nothing new.
func Lookup(store Store, keys []string) ([]string, error) {
	values := make([]string, 0, len(keys))
	for _, key := range keys {
		value, err := store.Get(key)
		if err != nil {
			return nil, err
		}
		values = append(values, value)
	}
	return values, nil
}

// LookupOr substitutes for any error, not only a missing key. The signature
// has nowhere to report a failure, so it must not be able to hide one either.
func LookupOr(store Store, keys []string, fallback string) []string {
	values := make([]string, 0, len(keys))
	for _, key := range keys {
		value, err := store.Get(key)
		if err != nil {
			value = fallback
		}
		values = append(values, value)
	}
	return values
}

func main() {
	store := MapStore{"a": "1"}
	fmt.Println(Lookup(store, []string{"a"}))
}
