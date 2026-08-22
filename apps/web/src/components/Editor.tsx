import Monaco, { loader } from '@monaco-editor/react';
import { useEffect } from 'react';

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
}: EditorProps) {
  useEffect(installMonacoEnvironment, []);

  return (
    <Monaco
      path={path}
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(next) => onChange(next ?? '')}
      onMount={(editor, instance) => {
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
