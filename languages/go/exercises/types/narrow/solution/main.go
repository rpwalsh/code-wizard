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
	// The map is made here rather than left nil: reading a nil map is fine
	// and writing to one panics, so a constructor is the difference between
	// a usable zero value and a landmine.
	return &MapStore{items: make(map[string]string)}
}

func (s *MapStore) Get(key string) (string, bool) {
	value, found := s.items[key]
	return value, found
}

func (s *MapStore) Put(key, value string) error {
	s.items[key] = value
	return nil
}

// Frozen wraps any Store and refuses writes.
type Frozen struct {
	Inner Store
}

func (f Frozen) Get(key string) (string, bool) {
	return f.Inner.Get(key)
}

func (f Frozen) Put(key, value string) error {
	return ErrReadOnly
}

// FirstFound returns the first value present in any store, in order.
func FirstFound(stores []Store, key string) (string, bool) {
	for _, store := range stores {
		if value, found := store.Get(key); found {
			return value, true
		}
	}
	return "", false
}

// CanWrite reports whether a Store also happens to be writable.
func CanWrite(store Store) bool {
	// The comma-ok form of a type assertion: it asks rather than demands,
	// so a store that cannot write is an answer instead of a panic.
	_, ok := store.(Writer)
	return ok
}
