// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "fmt"

// ErrNotFound is returned when a key is absent. Replace this.
var ErrNotFound = fmt.Errorf("TODO")

func Load(store map[string]string, key string) (string, error) {
	return "", fmt.Errorf("not implemented")
}

func LoadAll(store map[string]string, keys []string) ([]string, error) {
	return nil, fmt.Errorf("not implemented")
}

func IsMissing(err error) bool {
	return false
}

func main() {
	value, err := Load(map[string]string{"a": "1"}, "a")
	fmt.Println(value, err)
}
