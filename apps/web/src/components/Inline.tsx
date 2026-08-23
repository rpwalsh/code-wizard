// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { Fragment } from 'react';

/**
 * Backticks, rendered as code.
 *
 * Not a markdown parser and deliberately not one. Activity content is written
 * by hand in YAML and uses exactly one piece of inline formatting — a
 * backticked identifier — because that is what technical prose needs and
 * anything more would invite headings and tables into a sentence. Fifteen
 * lines here is cheaper than a dependency and cannot render anything the
 * author did not intend.
 *
 * Output is text and `<code>` elements, so nothing here can inject markup.
 */
export function Inline({ text }: { readonly text: string }) {
  const parts = text.split(/(`[^`]+`)/gu);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code key={index} className="inline-code">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
