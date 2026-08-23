// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * Types for the PHP 8.4 binary package, which ships none of its own.
 *
 * Declared narrowly: one export, with the shape this runtime actually calls.
 * A wider guess would be a fiction the compiler enforces, which is worse than
 * a small truthful one.
 */
declare module '@php-wasm/web-8-4' {
  import type { PHPLoaderModule } from '@php-wasm/universal';

  export function getPHPLoaderModule(): Promise<PHPLoaderModule>;
}
