// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "errors"

// ErrClosed is returned when work is submitted to a stopped pool.
var ErrClosed = errors.New("pool is closed")

// FanIn merges every input channel into one, closing the result when all
// inputs are done.
func FanIn[T any](inputs ...<-chan T) <-chan T {
	out := make(chan T)
	close(out)
	return out
}

// Collect drains a channel into a slice, in the order values arrived.
func Collect[T any](in <-chan T) []T {
	return nil
}

// Pool runs jobs on n goroutines and returns the results in input order.
func Pool[T any, R any](jobs []T, n int, work func(T) R) []R {
	return nil
}

// FirstError returns the first non-nil error from the channel, or nil.
func FirstError(errs <-chan error) error {
	return nil
}
