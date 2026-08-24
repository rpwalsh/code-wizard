// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "errors"

// ErrNotFound is the sentinel a caller may test for.
var ErrNotFound = errors.New("not found")

// FieldError reports which field was rejected and why.
type FieldError struct {
	Field  string
	Reason string
}

func (e *FieldError) Error() string {
	return e.Field + ": " + e.Reason
}

// Load wraps whatever the store returned with the operation that failed.
func Load(id string, store func(string) error) error {
	return nil
}

// IsMissing reports whether anything in the chain is ErrNotFound.
func IsMissing(err error) bool {
	return false
}

// FieldOf returns the field name from a FieldError anywhere in the chain.
func FieldOf(err error) (string, bool) {
	return "", false
}

// FirstReason walks to the deepest error and returns its message.
func FirstReason(err error) string {
	return ""
}
