/// <reference types="vite/client" />

/**
 * Monaco ships types for its barrel entry but not for the deep ESM paths.
 * The implementation is imported from the deep path (to avoid pulling in every
 * language grammar) and typed from the barrel, which is types-only and adds
 * nothing to the bundle.
 */
declare module 'monaco-editor/esm/vs/editor/edcore.main.js';
