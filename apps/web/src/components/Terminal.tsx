import type { ExecutionResult } from '@forge/core';

interface TerminalProps {
  readonly result: ExecutionResult | null;
  readonly busy: boolean;
}

/** Program output, as it came out — not summarised, not interpreted. */
export function Terminal({ result, busy }: TerminalProps) {
  if (busy) {
    return (
      <div className="panel" aria-busy="true">
        <p className="muted">Running…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="panel">
        <p className="muted">Output from Run appears here.</p>
      </div>
    );
  }

  return (
    <div className="panel terminal">
      {result.outcome === 'timeout' ? (
        <p className="run-problem" role="alert">
          Stopped after the time limit. Is there a loop that never ends?
        </p>
      ) : null}

      {result.stdout ? <pre className="output">{result.stdout}</pre> : null}
      {result.stderr ? <pre className="output output--error">{result.stderr}</pre> : null}

      {!result.stdout && !result.stderr && result.outcome === 'completed' ? (
        <p className="muted">The program produced no output.</p>
      ) : null}

      <p className="muted terminal__status">
        exit {result.exitCode ?? '—'} · {(result.durationMs / 1000).toFixed(2)}s
        {result.truncated ? ' · output truncated' : ''}
      </p>
    </div>
  );
}
