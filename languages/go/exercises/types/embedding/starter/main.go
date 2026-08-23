// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

// Base describes itself by name.
type Base struct {
	Name string
}

func (b Base) Describe() string {
	return ""
}

// Stamped embeds Base and adds a version to the description.
type Stamped struct {
	Base
	Version int
}

func (s Stamped) Describe() string {
	return ""
}

// NameError reports an invalid name.
type NameError struct {
	Reason string
}

func (e *NameError) Error() string {
	return e.Reason
}

// Validate returns nil for a usable name — the literal nil.
func Validate(name string) error {
	return nil
}

// IsReallyNil reports whether err is nil as an interface.
func IsReallyNil(err error) bool {
	return false
}

// Safely runs operation, converting a panic into an error.
func Safely(operation func() string) (string, error) {
	return "", nil
}

func main() {}
