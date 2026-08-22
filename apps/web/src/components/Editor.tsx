import Monaco, { loader } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

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
  readonly onChange: (value: string) => void;
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

  return (
    <Monaco
      path={path}
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(next) => onChange(next ?? '')}
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
