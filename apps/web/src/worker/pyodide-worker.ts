/**
 * The browser worker entry.
 *
 * Vite needs a module it can point a `new Worker(new URL(...))` at; the actual
 * implementation lives in @code-retrainer/runtime-web so the desktop build, the tests
 * and this one all run identical code.
 */
import '@code-retrainer/runtime-web/worker';
