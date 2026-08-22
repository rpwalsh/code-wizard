/**
 * The browser worker entry.
 *
 * Vite needs a module it can point a `new Worker(new URL(...))` at; the actual
 * implementation lives in @forge/runtime-web so the desktop build, the tests
 * and this one all run identical code.
 */
import '@forge/runtime-web/worker';
