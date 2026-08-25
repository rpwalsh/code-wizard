// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#ifndef MAIN_HPP
#define MAIN_HPP

#include <array>
#include <cstddef>
#include <string>
#include <vector>

/**
 * A fixed-size window over a stream, keeping the newest `Capacity` values.
 *
 * The capacity is a template parameter rather than a constructor argument,
 * so it is part of the type: the storage can be a plain array with no
 * allocation anywhere, and a buffer of four is a different type from a
 * buffer of eight rather than the same type in a different mood.
 */
template <typename T, std::size_t Capacity>
class RingBuffer {
  public:
    void push(const T &value) {
        // One past the last is the same slot as the first once the buffer is
        // full, which is the entire trick and the reason for the modulus.
        const std::size_t slot = (first_ + count_) % Capacity;
        slots_[slot] = value;

        if (count_ == Capacity) {
            first_ = (first_ + 1) % Capacity;
            dropped_ += 1;
            return;
        }
        count_ += 1;
    }

    std::size_t size() const { return count_; }

    bool full() const { return count_ == Capacity; }

    /** The oldest value still held. Only ask when size() is not zero. */
    const T &oldest() const { return slots_[first_]; }

    /** How many values have been pushed out by newer ones, ever. */
    std::size_t dropped() const { return dropped_; }

    /** Everything held, oldest first, leaving the buffer empty. */
    std::vector<T> drain() {
        std::vector<T> out;
        for (std::size_t offset = 0; offset < count_; offset += 1) {
            out.push_back(slots_[(first_ + offset) % Capacity]);
        }
        // Only the count is cleared. Where the window sits does not matter
        // once nothing is in it, because the next push writes at first_ and
        // reads start from first_ again.
        count_ = 0;
        return out;
    }

  private:
    std::array<T, Capacity> slots_{};
    std::size_t first_ = 0;
    std::size_t count_ = 0;
    std::size_t dropped_ = 0;
};

/** The general case: anything std::to_string can already handle. */
template <typename T>
std::string describe(const T &value) {
    return std::to_string(value);
}

/**
 * bool is a special case because the general one is wrong, not because it
 * fails: std::to_string(true) compiles and returns "1".
 */
template <>
inline std::string describe<bool>(const bool &value) {
    if (value) {
        return "true";
    }
    return "false";
}

/** std::string is a special case because the general one does not compile. */
template <>
inline std::string describe<std::string>(const std::string &value) {
    return "'" + value + "'";
}

#endif /* MAIN_HPP */
