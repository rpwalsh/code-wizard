// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"fmt"
)

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
	if err := store(id); err != nil {
		// %w rather than %v: %v formats the error into the message and
		// throws the value away, so errors.Is and errors.As downstream stop
		// working and nobody notices until a caller needs them.
		return fmt.Errorf("load %s: %w", id, err)
	}
	return nil
}

// IsMissing reports whether anything in the chain is ErrNotFound.
func IsMissing(err error) bool {
	// errors.Is walks the chain. Comparing with == only ever sees the
	// outermost error, which is the wrapper, not the sentinel.
	return errors.Is(err, ErrNotFound)
}

// FieldOf returns the field name from a FieldError anywhere in the chain.
func FieldOf(err error) (string, bool) {
	var field *FieldError
	if errors.As(err, &field) {
		return field.Field, true
	}
	return "", false
}

// FirstReason walks to the deepest error and returns its message.
func FirstReason(err error) string {
	if err == nil {
		return ""
	}

	// Unwrap returns nil at the bottom, which is the loop's own terminator.
	for {
		next := errors.Unwrap(err)
		if next == nil {
			return err.Error()
		}
		err = next
	}
}
