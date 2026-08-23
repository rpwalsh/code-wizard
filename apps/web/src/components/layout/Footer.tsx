// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The one line every page carries. Quiet on purpose: the footer is chrome,
 * and chrome that competes with content loses twice.
 */
export function Footer() {
  return (
    <footer className="footer">
      <span>© 2026 Ryan P. Walsh</span>
      <span aria-hidden="true">·</span>
      <span>rpwalsh.github.io</span>
      <span className="footer__spacer" />
      <span>No model anywhere in this product.</span>
    </footer>
  );
}
