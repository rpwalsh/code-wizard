// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"errors"
	"sync"
)

// ErrClosed is returned when work is submitted to a stopped pool.
var ErrClosed = errors.New("pool is closed")

// FanIn merges every input channel into one, closing the result when all
// inputs are done.
func FanIn[T any](inputs ...<-chan T) <-chan T {
	out := make(chan T)

	var wg sync.WaitGroup
	for _, input := range inputs {
		wg.Add(1)
		// The loop variable is passed as an argument rather than captured:
		// before Go 1.22 every goroutine shared one variable and read the
		// last channel, which is the classic version of this bug.
		go func(c <-chan T) {
			defer wg.Done()
			for value := range c {
				out <- value
			}
		}(input)
	}

	// Closing has to happen after every sender is finished and cannot happen
	// on this goroutine, or the function would block before returning.
	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}

// Collect drains a channel into a slice, in the order values arrived.
func Collect[T any](in <-chan T) []T {
	// Ranging over a channel ends when it is closed. A sender that forgets
	// to close leaves this blocked forever, which is what a deadlock in Go
	// usually is.
	values := []T{}
	for value := range in {
		values = append(values, value)
	}
	return values
}

// Pool runs jobs on n goroutines and returns the results in input order.
func Pool[T any, R any](jobs []T, n int, work func(T) R) []R {
	results := make([]R, len(jobs))
	if len(jobs) == 0 {
		return results
	}

	if n < 1 {
		n = 1
	}
	if n > len(jobs) {
		n = len(jobs)
	}

	indexes := make(chan int)
	var wg sync.WaitGroup

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for index := range indexes {
				// Each worker writes its own slot, so no lock is needed:
				// distinct elements of a slice are distinct memory.
				results[index] = work(jobs[index])
			}
		}()
	}

	for index := range jobs {
		indexes <- index
	}
	close(indexes)
	wg.Wait()

	return results
}

// FirstError returns the first non-nil error from the channel, or nil.
func FirstError(errs <-chan error) error {
	var first error
	// Drained to the end even after a hit: leaving a buffered channel
	// unread blocks whoever is still sending into it.
	for err := range errs {
		if err != nil && first == nil {
			first = err
		}
	}
	return first
}
