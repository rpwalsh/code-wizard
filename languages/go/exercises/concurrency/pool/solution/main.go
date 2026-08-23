// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "sync"

type job struct {
	index int
	value int
}

// SquareAll squares every value using at most `workers` goroutines,
// preserving input order.
func SquareAll(values []int, workers int) []int {
	out := make([]int, len(values))
	if len(values) == 0 {
		return out
	}
	if workers < 1 {
		workers = 1
	}

	jobs := make(chan job)
	var wg sync.WaitGroup

	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				// Every worker writes a different element: index-addressed
				// writes contend with nobody, and the race detector agrees.
				out[j.index] = j.value * j.value
			}
		}()
	}

	for index, value := range values {
		jobs <- job{index: index, value: value}
	}
	// The sender closes. A receiver closing a channel a sender still
	// writes to is a panic, not a preference.
	close(jobs)
	wg.Wait()
	return out
}

// Total sums the values with the partial sums traveling through a channel.
func Total(values []int, workers int) int {
	if len(values) == 0 {
		return 0
	}
	if workers < 1 {
		workers = 1
	}
	if workers > len(values) {
		workers = len(values)
	}

	parts := make(chan int)
	chunk := (len(values) + workers - 1) / workers

	count := 0
	for start := 0; start < len(values); start += chunk {
		end := start + chunk
		if end > len(values) {
			end = len(values)
		}
		count++
		go func(share []int) {
			sum := 0
			for _, value := range share {
				sum += value
			}
			// The partial travels through the channel: no shared counter,
			// no mutex, nothing to guard.
			parts <- sum
		}(values[start:end])
	}

	total := 0
	for i := 0; i < count; i++ {
		total += <-parts
	}
	return total
}

// Pipeline runs generator -> double -> increment, each stage a goroutine.
func Pipeline(values []int) []int {
	generated := make(chan int)
	doubled := make(chan int)
	incremented := make(chan int)

	go func() {
		defer close(generated)
		for _, value := range values {
			generated <- value
		}
	}()

	go func() {
		// The close travels down the pipe: input closing closes the output.
		defer close(doubled)
		for value := range generated {
			doubled <- value * 2
		}
	}()

	go func() {
		defer close(incremented)
		for value := range doubled {
			incremented <- value + 1
		}
	}()

	out := make([]int, 0, len(values))
	for value := range incremented {
		out = append(out, value)
	}
	return out
}

func main() {}
