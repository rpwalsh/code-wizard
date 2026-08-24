// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <cstddef>
#include <vector>

/// How many copies and moves have happened since the last reset.
struct Stats {
    int copies;
    int moves;
};

/// Owns a block of bytes. The whole point is what happens when it is passed.
class Buffer {
public:
    explicit Buffer(std::size_t size);
    Buffer(const Buffer &other);
    Buffer(Buffer &&other) noexcept;
    Buffer &operator=(const Buffer &other);
    Buffer &operator=(Buffer &&other) noexcept;
    ~Buffer();

    std::size_t size() const;
    bool empty() const;

    static Stats stats();
    static void reset();

private:
    std::size_t size_;
    char *data_;
};

Buffer duplicate(const Buffer &source);
Buffer take(Buffer source);
std::vector<Buffer> collect(std::size_t count, std::size_t size);

#endif
