// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
package main

import "errors"

// Store is the behavior a caller needs, named where the caller lives.
type Store interface {
	Get(key string) (string, bool)
}

// Writer adds writing, so a read-only store can satisfy Store alone.
type Writer interface {
	Store
	Put(key, value string) error
}

var ErrReadOnly = errors.New("store is read only")

// MapStore is a writable store backed by a map.
type MapStore struct {
	items map[string]string
}

func NewMapStore() *MapStore {
	return nil
}

func (s *MapStore) Get(key string) (string, bool) {
	return "", false
}

func (s *MapStore) Put(key, value string) error {
	return nil
}

// Frozen wraps any Store and refuses writes.
type Frozen struct {
	Inner Store
}

func (f Frozen) Get(key string) (string, bool) {
	return "", false
}

func (f Frozen) Put(key, value string) error {
	return nil
}

// FirstFound returns the first value present in any store, in order.
func FirstFound(stores []Store, key string) (string, bool) {
	return "", false
}

// CanWrite reports whether a Store also happens to be writable.
func CanWrite(store Store) bool {
	return false
}
