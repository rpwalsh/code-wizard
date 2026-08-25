// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import Monaco, { loader } from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';

import { installMonacoEnvironment, monaco } from './monaco-setup.ts';

// Use the bundled, trimmed Monaco rather than letting the loader fetch a full
// copy from a CDN: the app must work from file:// in Electron and offline once
// cached.
loader.config({ monaco });

interface EditorProps {
  readonly path: string;
  readonly value: string;
  readonly language: string;
  readonly readOnly: boolean;
  /** Fluency and Simulation modes turn completion off entirely (spec §9). */
  readonly autocomplete: boolean;
  readonly fontSize: number;
  /**
   * Called with the path the change belongs to, not just the text.
   *
   * Monaco fires a change when it swaps models on a path change, and the
   * caller cannot tell that apart from a keystroke. Sending the path along
   * means a change can only ever be written to the file it came from.
   */
  readonly onChange: (path: string, value: string) => void;
  readonly onRunTests: () => void;
  /** Line the trace scrubber is currently on, if any. */
  readonly highlightLine?: number | null;
}

export function Editor({
  path,
  value,
  language,
  readOnly,
  autocomplete,
  fontSize,
  onChange,
  onRunTests,
  highlightLine = null,
}: EditorProps) {
  useEffect(installMonacoEnvironment, []);

  // Read during the change handler rather than closed over, so a change that
  // arrives while React is between renders still names the right file.
  const pathRef = useRef(path);
  pathRef.current = path;

  const editorRef = useRef<
    Parameters<NonNullable<Parameters<typeof Monaco>[0]['onMount']>>[0] | null
  >(null);
  const decorations = useRef<string[]>([]);

  // Mirror the trace scrubber into the editor, so stepping through a run moves
  // a marker down the learner's own code rather than a copy of it.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    decorations.current = editor.deltaDecorations(
      decorations.current,
      highlightLine === null
        ? []
        : [
            {
              range: new monaco.Range(highlightLine, 1, highlightLine, 1),
              options: {
                isWholeLine: true,
                className: 'traced-line',
                marginClassName: 'traced-line__margin',
              },
            },
          ],
    );

    if (highlightLine !== null) editor.revealLineInCenterIfOutsideViewport(highlightLine);
  }, [highlightLine]);

  // onMount runs once, so the label set there names whichever file happened
  // to be open first and then never changes. A screen reader user switching
  // tabs was told they were still in main.py.
  useEffect(() => {
    editorRef.current?.updateOptions({ ariaLabel: `${path} editor` });
  }, [path]);

  return (
    <Monaco
      path={path}
      language={language}
      value={value}
      theme={useEditorTheme()}
      onChange={(next) => onChange(pathRef.current, next ?? '')}
      onMount={(editor, instance) => {
        editorRef.current = editor;
        editor.addCommand(instance.KeyMod.CtrlCmd | instance.KeyCode.Enter, () => onRunTests());
        editor.updateOptions({ ariaLabel: `${path} editor` });
      }}
      options={{
        readOnly,
        fontSize,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        renderWhitespace: 'selection',
        // Closed-book practice means closed-book: no suggestions, no parameter
        // hints, and no word-based completion cribbed from the test files.
        quickSuggestions: autocomplete,
        suggestOnTriggerCharacters: autocomplete,
        wordBasedSuggestions: autocomplete ? 'currentDocument' : 'off',
        parameterHints: { enabled: autocomplete },
        acceptSuggestionOnEnter: autocomplete ? 'on' : 'off',
        inlineSuggest: { enabled: false },
        tabCompletion: autocomplete ? 'on' : 'off',
      }}
      loading={<p className="muted">Loading editor…</p>}
    />
  );
}

/**
 * Which Monaco theme matches the page right now.
 *
 * Monaco does not read CSS custom properties, so the choice has to be made in
 * JavaScript and kept in step by hand. It follows the same three states as the
 * rest of the interface: an explicit choice on the root wins, and otherwise
 * the system decides — including when the system changes while the page is
 * open, which is the case a one-off read at startup gets wrong.
 */
function useEditorTheme(): 'vs' | 'vs-dark' {
  const [dark, setDark] = useState(prefersDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDark(prefersDark());

    media.addEventListener('change', update);
    // The root attribute changes when the learner picks a theme, and that is
    // not something matchMedia reports.
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      media.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  return dark ? 'vs-dark' : 'vs';
}

function prefersDark(): boolean {
  const chosen = document.documentElement.getAttribute('data-theme');
  if (chosen === 'dark') return true;
  if (chosen === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
