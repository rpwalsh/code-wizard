// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The one line every page carries. Quiet on purpose: the footer is chrome,
 * and chrome that competes with content loses twice.
 *
 * It is also where the data control lives, because that is where people have
 * been trained by every other website to look for one.
 */
export function Footer({ onData }: { readonly onData?: () => void }) {
  return (
    <footer className="footer">
      <span>© 2026 Ryan P. Walsh</span>
      <span aria-hidden="true">·</span>
      <span>rpwalsh.github.io</span>
      <span className="footer__spacer" />
      <span>No model anywhere in this product.</span>
      {onData ? (
        <>
          <span aria-hidden="true">·</span>
          <button type="button" className="footer__link" onClick={onData}>
            Your data stays on this device
          </button>
        </>
      ) : null}
    </footer>
  );
}
