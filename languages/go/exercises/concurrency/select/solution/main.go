// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import (
	"context"
	"sync"
)

// First returns the first value any source delivers, or ctx.Err().
func First(ctx context.Context, sources ...<-chan string) (string, error) {
	// One forwarder per source into a shared channel keeps the select at
	// two cases whatever N is. Buffered by N so losing forwarders never
	// block after the winner is taken.
	merged := make(chan string, len(sources))
	for _, source := range sources {
		go func(ch <-chan string) {
			select {
			case value := <-ch:
				merged <- value
			case <-ctx.Done():
			}
		}(source)
	}

	select {
	case value := <-merged:
		return value, nil
	case <-ctx.Done():
		// ctx.Err() unchanged, so errors.Is(err, context.Canceled) works
		// for every caller downstream.
		return "", ctx.Err()
	}
}

// Collect receives up to count values, stopping early on cancellation
// (returning the partial result and ctx.Err()) or on a closed source.
func Collect(ctx context.Context, source <-chan int, count int) ([]int, error) {
	gathered := make([]int, 0, count)
	for len(gathered) < count {
		select {
		case value, ok := <-source:
			if !ok {
				// A closed stream is the normal end, not an error.
				return gathered, nil
			}
			gathered = append(gathered, value)
		case <-ctx.Done():
			// The work already done still comes back.
			return gathered, ctx.Err()
		}
	}
	return gathered, nil
}

// Merge fans every source into one channel until all close or done closes.
func Merge(done <-chan struct{}, sources ...<-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup

	for _, source := range sources {
		wg.Add(1)
		go func(ch <-chan int) {
			defer wg.Done()
			for {
				select {
				case value, ok := <-ch:
					if !ok {
						return
					}
					// The send itself needs a done case: blocked on out
					// with no reader left is the goroutine leak.
					select {
					case out <- value:
					case <-done:
						return
					}
				case <-done:
					return
				}
			}
		}(source)
	}

	go func() {
		wg.Wait()
		close(out)
	}()
	return out
}

func main() {}
