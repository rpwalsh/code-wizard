// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"fmt"
)

// ErrNotFound is the identity a caller tests for. Its message is incidental;
// the value is the point, which is why it is compared rather than matched.
var ErrNotFound = errors.New("not found")

// Load returns the value for key, or an error that carries ErrNotFound
// inside it so the cause survives the added context.
func Load(store map[string]string, key string) (string, error) {
	value, ok := store[key]
	if !ok {
		return "", fmt.Errorf("load %q: %w", key, ErrNotFound)
	}
	return value, nil
}

// LoadAll stops at the first failure and returns that error untouched.
// Wrapping it again here would add a layer that says nothing new.
func LoadAll(store map[string]string, keys []string) ([]string, error) {
	values := make([]string, 0, len(keys))
	for _, key := range keys {
		value, err := Load(store, key)
		if err != nil {
			return nil, err
		}
		values = append(values, value)
	}
	return values, nil
}

// IsMissing walks the wrap chain rather than comparing messages, so it keeps
// working when somebody improves the wording.
func IsMissing(err error) bool {
	return errors.Is(err, ErrNotFound)
}

func main() {
	value, err := Load(map[string]string{"a": "1"}, "a")
	fmt.Println(value, err)
}
