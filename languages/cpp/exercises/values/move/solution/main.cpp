// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <algorithm>
#include <utility>

namespace {
int copies = 0;
int moves = 0;
}  // namespace

Buffer::Buffer(std::size_t size) : size_(size), data_(new char[size]()) {}

Buffer::Buffer(const Buffer &other) : size_(other.size_), data_(new char[other.size_]()) {
    std::copy(other.data_, other.data_ + other.size_, data_);
    copies += 1;
}

Buffer::Buffer(Buffer &&other) noexcept : size_(other.size_), data_(other.data_) {
    // The source is left valid and empty rather than untouched: its
    // destructor still runs, and two objects owning one pointer is a double
    // free. `noexcept` matters as much — a vector growing will only move
    // elements if the move cannot throw, and copies them silently otherwise.
    other.size_ = 0;
    other.data_ = nullptr;
    moves += 1;
}

Buffer &Buffer::operator=(const Buffer &other) {
    if (this == &other) {
        return *this;
    }

    char *replacement = new char[other.size_]();
    std::copy(other.data_, other.data_ + other.size_, replacement);
    delete[] data_;
    data_ = replacement;
    size_ = other.size_;
    copies += 1;
    return *this;
}

Buffer &Buffer::operator=(Buffer &&other) noexcept {
    if (this == &other) {
        return *this;
    }

    delete[] data_;
    data_ = other.data_;
    size_ = other.size_;
    other.data_ = nullptr;
    other.size_ = 0;
    moves += 1;
    return *this;
}

Buffer::~Buffer() {
    delete[] data_;
}

std::size_t Buffer::size() const {
    return size_;
}

bool Buffer::empty() const {
    return size_ == 0;
}

Stats Buffer::stats() {
    return Stats{copies, moves};
}

void Buffer::reset() {
    copies = 0;
    moves = 0;
}

Buffer duplicate(const Buffer &source) {
    // A copy on purpose: the caller asked for a second one.
    return Buffer(source);
}

Buffer take(Buffer source) {
    // Taken by value, so the caller already decided whether that was a copy
    // or a move. `std::move` on the way out is what stops it being copied
    // again — `source` is a named object, so it is an lvalue however it
    // arrived here.
    return Buffer(std::move(source));
}

std::vector<Buffer> collect(std::size_t count, std::size_t size) {
    std::vector<Buffer> buffers;
    // Reserved first: without it the vector reallocates as it grows and
    // moves every element it already held, which the test can see.
    buffers.reserve(count);

    for (std::size_t index = 0; index < count; index += 1) {
        buffers.emplace_back(size);
    }

    return buffers;
}
