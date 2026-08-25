// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import { useEffect, useMemo, useRef, useState } from 'react';

import { useDialogFocus } from './layout/use-dialog-focus.ts';

export interface Command {
  readonly id: string;
  readonly name: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  run(): void;
}

interface PaletteProps {
  readonly open: boolean;
  readonly commands: readonly Command[];
  readonly onClose: () => void;
}

/**
 * The command palette.
 *
 * A developer tool where every action is reachable from the keyboard, and one
 * place that lists them all — which doubles as the shortcut documentation
 * nobody would otherwise read.
 */
export function Palette({ open, commands, onClose }: PaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) => command.name.toLowerCase().includes(needle));
  }, [commands, query]);

  // Before the effect that focuses the input, so the opener it remembers is
  // whatever the learner was on rather than the palette's own search box.
  useDialogFocus(surfaceRef, open);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);


  if (!open) return null;

  const choose = (index: number): void => {
    const command = matches[index];
    if (!command || command.disabled) return;
    onClose();
    command.run();
  };

  return (
    <div
      className="palette-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={surfaceRef}
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Commands"
      >
        <input
          ref={inputRef}
          className="palette__input"
          type="text"
          placeholder="Search commands…"
          value={query}
          aria-label="Search commands"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, matches.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              choose(active);
            }
          }}
        />

        {matches.length === 0 ? (
          <p className="palette__empty">No matching command.</p>
        ) : (
          <ul className="palette__list">
            {matches.map((command, index) => (
              <li key={command.id}>
                <button
                  type="button"
                  className="palette__item"
                  data-active={index === active}
                  disabled={command.disabled}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                >
                  <span className="palette__name">{command.name}</span>
                  {command.shortcut ? <kbd>{command.shortcut}</kbd> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Ctrl/Cmd-K from anywhere, including inside the editor. */
export function usePaletteShortcut(onOpen: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
