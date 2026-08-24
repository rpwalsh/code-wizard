// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#include "main.hpp"

#include <utility>

namespace {
int copies = 0;
int moves = 0;
}  // namespace

Buffer::Buffer(std::size_t size) : size_(size), data_(new char[size]()) {}

Buffer::Buffer(const Buffer &other) : size_(0), data_(nullptr) {
    (void)other;
}

Buffer::Buffer(Buffer &&other) noexcept : size_(0), data_(nullptr) {
    (void)other;
}

Buffer &Buffer::operator=(const Buffer &other) {
    (void)other;
    return *this;
}

Buffer &Buffer::operator=(Buffer &&other) noexcept {
    (void)other;
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
    (void)source;
    return Buffer(0);
}

Buffer take(Buffer source) {
    (void)source;
    return Buffer(0);
}

std::vector<Buffer> collect(std::size_t count, std::size_t size) {
    (void)count;
    (void)size;
    return {};
}
