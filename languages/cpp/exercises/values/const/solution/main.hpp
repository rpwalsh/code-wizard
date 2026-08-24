// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <map>
#include <optional>
#include <string>
#include <vector>

/**
 * A price list that can answer questions without being changed by them.
 *
 * Two of its members are `mutable`, which is not a loophole: `const` is a
 * promise about what a caller can observe, and neither a hit counter nor a
 * cached sum is part of what anybody observes.
 */
class Catalog {
  public:
    /** Set the price for a sku, replacing any price already there. */
    void add(const std::string &sku, int cents);

    /** The price, or nothing. Counts as a lookup. */
    std::optional<int> price(const std::string &sku) const;

    /** How many times price() has been asked. */
    int lookups() const;

    /** Every price added together. Computed once and remembered. */
    int total() const;

    /** Every sku, in order. */
    std::vector<std::string> skus() const;

  private:
    std::map<std::string, int> prices_;
    mutable int lookups_ = 0;
    mutable std::optional<int> total_;
};

/** The sku with the highest price, or an empty string. Ties go to the first. */
std::string dearest(const Catalog &catalog);
