// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The handbook, in a dialog that keeps its place.
 *
 * The behavior that matters is the one people expect from a reference and
 * almost never get: close it mid-sentence, do the thing you opened it for,
 * open it again and be exactly where you were. A reference that resets to
 * its front page every time is a reference nobody consults twice, because
 * the cost of getting back is higher than the cost of guessing.
 *
 * Two pieces of state make that work, and they are deliberately different.
 * The article is a preference — it goes through the same store as everything
 * else, so it survives a reload and travels with an export. The scroll
 * position is not: it is a fact about this visit, kept in a ref, because
 * writing it to a database on every scroll event would be absurd and
 * restoring it after a week would be surprising rather than helpful.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { Inline } from '../Inline.tsx';
import { Modal } from './Modal.tsx';
import { HANDBOOK, handbookSections, type Article } from '../../content/handbook.ts';

interface HandbookProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** The article to show. Persisted by the caller. */
  readonly articleId: string;
  readonly onArticle: (id: string) => void;
}

const FALLBACK: Article = HANDBOOK[0]!;

export function Handbook({ open, onClose, articleId, onArticle }: HandbookProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  // Per article, so returning to one you were halfway through returns you to
  // the middle of it rather than to the top of the one you left.
  const offsets = useRef(new Map<string, number>());
  const [current, setCurrent] = useState<string>(articleId);

  useEffect(() => {
    if (open) setCurrent(articleId);
  }, [open, articleId]);

  const article = HANDBOOK.find((entry) => entry.id === current) ?? FALLBACK;

  // Restore after the content for this article has rendered, or the element
  // is still the previous height and the assignment is clamped away.
  useEffect(() => {
    if (!open) return;
    const body = bodyRef.current;
    if (!body) return;

    const frame = requestAnimationFrame(() => {
      body.scrollTop = offsets.current.get(article.id) ?? 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, article.id]);

  const remember = useCallback(() => {
    const body = bodyRef.current;
    if (body) offsets.current.set(article.id, body.scrollTop);
  }, [article.id]);

  // Recorded on the way out as well as on scroll: a dialog dismissed by
  // Escape or by a click on the backdrop never fires a final scroll event.
  const close = useCallback(() => {
    remember();
    onClose();
  }, [remember, onClose]);

  const choose = (id: string): void => {
    remember();
    setCurrent(id);
    onArticle(id);
  };

  return (
    <Modal open={open} label="Handbook" onClose={close} size="full">
      <div className="handbook">
        <nav className="handbook__nav" aria-label="Handbook contents">
          {handbookSections().map((group) => (
            <div key={group.section} className="handbook__group">
              <p className="handbook__section">{group.section}</p>
              <ul>
                {group.articles.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className="handbook__link"
                      aria-current={entry.id === article.id ? 'page' : undefined}
                      onClick={() => choose(entry.id)}
                    >
                      {entry.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <article className="handbook__body" ref={bodyRef} onScroll={remember} tabIndex={0}>
          <h2 className="handbook__title">{article.title}</h2>
          {article.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>
              <Inline text={paragraph} />
            </p>
          ))}
        </article>
      </div>
    </Modal>
  );
}
