// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "context"

// First returns the first value any source delivers, or ctx.Err().
func First(ctx context.Context, sources ...<-chan string) (string, error) {
	return "", nil
}

// Collect receives up to count values, stopping early on cancellation
// (returning the partial result and ctx.Err()) or on a closed source.
func Collect(ctx context.Context, source <-chan int, count int) ([]int, error) {
	return nil, nil
}

// Merge fans every source into one channel until all close or done closes.
func Merge(done <-chan struct{}, sources ...<-chan int) <-chan int {
	return nil
}

func main() {}
