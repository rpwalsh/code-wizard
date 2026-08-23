// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/*
 * The C++ test harness: one header, no build system, no dependencies.
 *
 * A learner practicing C should be writing C, not fighting CMake. So the whole
 * harness is a single header, and running the tests is compiling a handful of
 * files together. Nothing to install and nothing to configure.
 *
 * A test file looks like this:
 *
 *     #include "retrainer.hpp"
 *     #include "main.hpp"
 *
 *     RETRAINER_TEST(returns_the_sum, "cpp.basics.functions") {
 *         RETRAINER_ASSERT_INT(add(2, 3), 5);
 *     }
 *
 * Note what it does *not* end with. The entry point lives in
 * `retrainer_main.cpp`, which the runtime compiles alongside every test file.
 * An earlier version put a `RETRAINER_MAIN()` macro at the bottom of each test
 * file, which meant two test files defined two `main` functions and would not
 * link — so an exercise could have exactly one test file, and the
 * visible/hidden split every other language has was impossible here.
 *
 * This is the standard single-header library shape: the header declares, and
 * exactly one translation unit defines by setting RETRAINER_IMPLEMENTATION
 * before including it. Anything `static` would give each translation unit its
 * own registry, so the entry point would find it empty and report that the
 * exercise has no tests.
 *
 * Registration happens through constructor attributes, which is how every C
 * test framework does this and the only way to collect tests without a
 * preprocessing step. The cap is fixed and generous: a static array cannot
 * fail to allocate half way through a run, and an exercise with two hundred
 * and fifty-seven cases is not an exercise.
 *
 * The output is the same JSON report every other language here writes, because
 * the engine above the runtime boundary must not be able to tell which
 * language produced a failure.
 */
#ifndef RETRAINER_HPP
#define RETRAINER_HPP

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <sstream>
#include <string>

#define RETRAINER_MAX_TESTS 256
#define RETRAINER_MSG 1024

typedef struct {
    const char *name;
    /* Named `skill` rather than `concept`, which is a C++20 keyword. */
    const char *skill;
    const char *file;
    int line;
    void (*body)(void);
} RetrainerCase;

extern RetrainerCase retrainer_cases[RETRAINER_MAX_TESTS];
extern int retrainer_count;

/* Set by an assertion when it fails. Longjmp is avoided deliberately: it makes
 * cleanup in the code under test unpredictable, and the first failing
 * assertion is the informative one anyway, so later ones are ignored. */
extern int retrainer_failed;
extern char retrainer_message[RETRAINER_MSG];
extern char retrainer_expected[RETRAINER_MSG];
extern char retrainer_received[RETRAINER_MSG];

void retrainer_register(const char *name, const char *skill, const char *file, int line,
                        void (*body)(void));
void retrainer_fail(const char *message, const char *expected, const char *received);
int retrainer_run(const char *report_path);

/*
 * Constructor attributes run registration before main.
 *
 * Supported by clang, gcc and every other compiler this platform looks for.
 * MSVC is not among them, and saying so here is cheaper than a mysterious
 * "0 tests collected" on a machine where only MSVC is installed.
 */
#if defined(__GNUC__) || defined(__clang__)
#define RETRAINER_CONSTRUCTOR __attribute__((constructor))
#else
#error "The C harness needs a GCC-compatible compiler (clang, gcc, or MinGW)."
#endif

#define RETRAINER_TEST(test_name, test_concept)                                       \
    static void retrainer_body_##test_name(void);                                     \
    static void RETRAINER_CONSTRUCTOR retrainer_reg_##test_name(void) {               \
        retrainer_register(#test_name, test_concept, __FILE__, __LINE__,              \
                           retrainer_body_##test_name);                               \
    }                                                                                 \
    static void retrainer_body_##test_name(void)

/* -- assertions --------------------------------------------------------- */

#define RETRAINER_ASSERT(condition, description)                                      \
    do {                                                                              \
        if (!(condition)) retrainer_fail(description, "true", "false");               \
    } while (0)

#define RETRAINER_ASSERT_INT(actual, wanted)                                          \
    do {                                                                              \
        long long r_a = (long long)(actual);                                          \
        long long r_w = (long long)(wanted);                                          \
        if (r_a != r_w) {                                                             \
            char e[64], g[64];                                                        \
            snprintf(e, sizeof e, "%lld", r_w);                                       \
            snprintf(g, sizeof g, "%lld", r_a);                                       \
            retrainer_fail(#actual " != " #wanted, e, g);                             \
        }                                                                             \
    } while (0)

#define RETRAINER_ASSERT_STR(actual, wanted)                                          \
    do {                                                                              \
        const char *r_a = (actual);                                                   \
        const char *r_w = (wanted);                                                   \
        if (r_a == NULL || r_w == NULL || strcmp(r_a, r_w) != 0) {                    \
            retrainer_fail(#actual " != " #wanted, r_w ? r_w : "(null)",              \
                           r_a ? r_a : "(null)");                                     \
        }                                                                             \
    } while (0)

/* Floating point is compared with a tolerance, never with ==, because the
 * alternative is exercises that fail on a different optimization level. */
#define RETRAINER_ASSERT_NEAR(actual, wanted, tolerance)                              \
    do {                                                                              \
        double r_a = (double)(actual);                                                \
        double r_w = (double)(wanted);                                                \
        double r_d = r_a - r_w;                                                       \
        if (r_d < 0) r_d = -r_d;                                                      \
        if (!(r_d <= (double)(tolerance))) {                                          \
            char e[64], g[64];                                                        \
            snprintf(e, sizeof e, "%.10g", r_w);                                      \
            snprintf(g, sizeof g, "%.10g", r_a);                                       \
            retrainer_fail(#actual " != " #wanted, e, g);                             \
        }                                                                             \
    } while (0)

/* Any two values that compare with == and can be streamed. A learner's own
 * type prints the way they made it print, rather than as an address. */
#define RETRAINER_ASSERT_EQ(actual, wanted)                                               do {                                                                                      auto r_a = (actual);                                                                  auto r_w = (wanted);                                                                  if (!(r_a == r_w)) {                                                                      retrainer_fail(#actual " != " #wanted, retrainer_show(r_w).c_str(),                                  retrainer_show(r_a).c_str());                                      }                                                                                 } while (0)

/** Rendered with the stream operator the type already has. */
template <typename T>
static std::string retrainer_show(const T &value) {
    std::ostringstream out;
    out << value;
    return out.str();
}

/* -- implementation ----------------------------------------------------- */

#ifdef RETRAINER_IMPLEMENTATION

RetrainerCase retrainer_cases[RETRAINER_MAX_TESTS];
int retrainer_count = 0;
int retrainer_failed = 0;
char retrainer_message[RETRAINER_MSG];
char retrainer_expected[RETRAINER_MSG];
char retrainer_received[RETRAINER_MSG];

/*
 * `__FILE__` as the exercise declared it.
 *
 * The compiler echoes back whatever path it was handed. The runtime passes
 * workspace-relative paths, so this only has to drop a leading `./` and
 * normalize separators — but doing neither leaves an id the engine cannot
 * match against the manifest, and the exercise reports zero tests.
 *
 * 92 is a backslash, written as its code rather than as a character literal so
 * nothing between here and the compiler has to escape it correctly.
 */
#define RETRAINER_BACKSLASH 92

static const char *retrainer_relative(const char *file) {
    static char buffer[512];
    const char *source = file;
    if (source[0] == '.' && (source[1] == '/' || source[1] == RETRAINER_BACKSLASH)) source += 2;

    size_t position = 0;
    while (source[position] && position + 1 < sizeof buffer) {
        buffer[position] = source[position] == RETRAINER_BACKSLASH ? '/' : source[position];
        position++;
    }
    buffer[position] = 0;
    return buffer;
}

void retrainer_register(const char *name, const char *skill, const char *file, int line,
                        void (*body)(void)) {
    if (retrainer_count >= RETRAINER_MAX_TESTS) {
        fprintf(stderr, "retrainer: more than %d tests\n", RETRAINER_MAX_TESTS);
        exit(2);
    }
    RetrainerCase *entry = &retrainer_cases[retrainer_count++];
    entry->name = name;
    entry->skill = skill;
    entry->file = file;
    entry->line = line;
    entry->body = body;
}

void retrainer_fail(const char *message, const char *expected, const char *received) {
    if (retrainer_failed) return; /* keep the first, which is the useful one */
    retrainer_failed = 1;
    snprintf(retrainer_message, RETRAINER_MSG, "%s", message);
    snprintf(retrainer_expected, RETRAINER_MSG, "%s", expected ? expected : "");
    snprintf(retrainer_received, RETRAINER_MSG, "%s", received ? received : "");
}

static void retrainer_json(FILE *out, const char *text) {
    fputc('"', out);
    for (const unsigned char *p = (const unsigned char *)text; *p; p++) {
        switch (*p) {
            case '"': fputs("\\\"", out); break;
            case '\\': fputs("\\\\", out); break;
            case '\n': fputs("\\n", out); break;
            case '\r': fputs("\\r", out); break;
            case '\t': fputs("\\t", out); break;
            default:
                if (*p < 0x20) fprintf(out, "\\u%04x", *p);
                else fputc(*p, out);
        }
    }
    fputc('"', out);
}

int retrainer_run(const char *report_path) {
    FILE *out = fopen(report_path, "w");
    if (!out) {
        fprintf(stderr, "retrainer: cannot write %s\n", report_path);
        return 2;
    }

    int failures = 0;
    fputs("{\"schema\":1,\"collectionErrors\":[],\"cases\":[", out);

    for (int i = 0; i < retrainer_count; i++) {
        RetrainerCase *entry = &retrainer_cases[i];
        retrainer_failed = 0;
        retrainer_message[0] = retrainer_expected[0] = retrainer_received[0] = 0;

        clock_t began = clock();
        entry->body();
        double ms = (double)(clock() - began) * 1000.0 / CLOCKS_PER_SEC;

        if (retrainer_failed) failures++;
        if (i > 0) fputc(',', out);

        /* `path::name`, because the engine keys a test file's visibility and
         * its collection check on the file portion of the id. */
        char id[512];
        const char *relative = retrainer_relative(entry->file);
        snprintf(id, sizeof id, "%s::%s", relative, entry->name);

        fputs("{\"id\":", out);
        retrainer_json(out, id);
        fputs(",\"file\":", out);
        retrainer_json(out, relative);
        fputs(",\"name\":", out);
        retrainer_json(out, entry->name);
        fprintf(out, ",\"status\":\"%s\",\"durationMs\":%.3f",
                retrainer_failed ? "failed" : "passed", ms);

        if (entry->skill && entry->skill[0]) {
            fputs(",\"concept\":", out);
            retrainer_json(out, entry->skill);
        }
        if (retrainer_failed) {
            fputs(",\"message\":", out);
            retrainer_json(out, retrainer_message);
            fputs(",\"expected\":", out);
            retrainer_json(out, retrainer_expected);
            fputs(",\"received\":", out);
            retrainer_json(out, retrainer_received);
        }

        fputs(",\"location\":{\"path\":", out);
        retrainer_json(out, relative);
        fprintf(out, ",\"line\":%d}}", entry->line);
    }

    fprintf(out, "],\"exitStatus\":%d}", failures > 0 ? 1 : 0);
    fclose(out);
    return failures > 0 ? 1 : 0;
}

#endif /* RETRAINER_IMPLEMENTATION */

#endif /* RETRAINER_HPP */
