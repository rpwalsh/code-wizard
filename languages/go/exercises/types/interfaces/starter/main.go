// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"fmt"
)

// ErrMissing is returned when a key is absent.
var ErrMissing = errors.New("missing")

// Store is what Lookup needs. Declare it here, in the package that uses it.
type Store interface {
	// TODO
}

// MapStore is a Store backed by a map.
type MapStore map[string]string

func Lookup(store Store, keys []string) ([]string, error) {
	return nil, errors.New("not implemented")
}

func LookupOr(store Store, keys []string, fallback string) []string {
	return nil
}

func main() {
	store := MapStore{"a": "1"}
	fmt.Println(Lookup(store, []string{"a"}))
}
