// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/*
 * The entry point for a C++ test run.
 *
 * Compiled once, alongside every test file. It used to live at the bottom of
 * each test file as `RETRAINER_MAIN()`, which meant two test files defined two
 * `main` functions and the link failed — so an exercise could have exactly one
 * test file, and the visible/hidden split that every other language has was
 * impossible here.
 *
 * Tests register themselves through constructor attributes before `main` runs,
 * so this needs to know nothing about them.
 */
/* The one translation unit that defines the harness, not just declares it. */
#define RETRAINER_IMPLEMENTATION
#include "retrainer.hpp"

int main(int argc, char **argv) {
    const char *report = argc > 1 ? argv[1] : ".retrainer-report.json";
    return retrainer_run(report);
}
