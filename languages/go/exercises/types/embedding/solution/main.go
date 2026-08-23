// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "fmt"

// Base describes itself by name.
type Base struct {
	Name string
}

func (b Base) Describe() string {
	return "BASE:" + b.Name
}

// Stamped embeds Base and adds a version to the description.
type Stamped struct {
	Base
	Version int
}

func (s Stamped) Describe() string {
	// Delegation with sugar, not inheritance: the embedded original is a
	// field with the type's name, called here on purpose and by name.
	return fmt.Sprintf("%s@v%d", s.Base.Describe(), s.Version)
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
	if name == "" {
		return &NameError{Reason: "name must not be empty"}
	}
	// The literal, never a typed variable that happens to be nil: an
	// interface holding (type=*NameError, value=nil) is not nil.
	return nil
}

// IsReallyNil reports whether err is nil as an interface.
func IsReallyNil(err error) bool {
	return err == nil
}

// Safely runs operation, converting a panic into an error.
func Safely(operation func() string) (result string, err error) {
	// A deferred closure over named returns is the only code that can set
	// the return value after a panic. This is recover's one honest home:
	// a boundary restoring failures-travel-by-return-value.
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r)
		}
	}()
	return operation(), nil
}

func main() {}
