import type { TraceResult, TraceStep } from '@code-retrainer/core';
import { stateAt } from '@code-retrainer/core';
import { useEffect, useMemo, useState } from 'react';

interface TraceScopeProps {
  readonly trace: TraceResult | null;
  readonly busy: boolean;
  /**
   * Every file in the workspace, because a trace crosses them.
   *
   * Tracing a failing test starts in the test file and steps down into the
   * learner's code; showing only the file that happened to be open in the
   * editor would leave the marker pointing at the wrong lines.
   */
  readonly files: readonly { readonly path: string; readonly contents: string }[];
  readonly onRun: () => void;
  readonly onHighlight: (file: string, line: number) => void;
}

/**
 * The computational microscope.
 *
 * When a learner cannot say why their program produced 41, this is the answer
 * the product is willing to give: not a sentence, but the ability to watch the
 * value change. Scrub the timeline, see which line ran, see what moved.
 *
 * Everything shown here is a recording of what actually happened. Nothing is
 * inferred, predicted or explained — the instrument reports, and the learner
 * does the reasoning. That division is the whole point.
 */
export function TraceScope({ trace, busy, files, onRun, onHighlight }: TraceScopeProps) {
  const [index, setIndex] = useState(0);

  // Only line events are worth scrubbing through: call and return frames carry
  // no state change and would make the slider feel like it was sticking.
  const timeline = useMemo(
    () => (trace ? trace.steps.filter((step) => step.event !== 'call') : []),
    [trace],
  );

  useEffect(() => {
    setIndex(0);
  }, [trace]);

  const current = timeline[index];

  useEffect(() => {
    if (current) onHighlight(current.file, current.line);
  }, [current, onHighlight]);

  if (busy) {
    return (
      <section aria-busy="true">
        <p className="label">Recording</p>
        <p className="empty">Running your program one line at a time…</p>
      </section>
    );
  }

  if (!trace) {
    return (
      <section>
        <p className="label">Trace</p>
        <p className="empty">
          Watch your code run one line at a time and see every value change as it happens. Most
          useful on a failing test — open one and choose <em>Watch it run</em>.
        </p>
        <button type="button" className="button" onClick={onRun} style={{ marginTop: 12 }}>
          Record a trace
        </button>
      </section>
    );
  }

  if (trace.outcome !== 'completed') {
    return (
      <section>
        <p className="label">Trace</p>
        <p className="notice notice--error" role="alert">
          {trace.outcome === 'timeout'
            ? 'Tracing took too long to finish.'
            : trace.stderr || 'The trace could not be recorded.'}
        </p>
      </section>
    );
  }

  if (timeline.length === 0) {
    return (
      <section>
        <p className="label">Trace</p>
        <p className="empty">
          Nothing ran. Your file defines things but never calls them — add a call at the bottom and
          trace again, or run the tests and watch a failing one instead.
        </p>
        <button type="button" className="button" onClick={onRun} style={{ marginTop: 12 }}>
          Record again
        </button>
      </section>
    );
  }

  const visible = stateAt(
    trace.steps,
    // The slider indexes the filtered timeline; state has to be replayed over
    // the unfiltered one or changes inside calls would be lost.
    trace.steps.indexOf(current ?? trace.steps[0]!),
  );

  return (
    <section className="scope">
      <div className="section__head">
        <p className="label">Trace</p>
        <p className="label numeral">
          {index + 1} / {timeline.length}
          {trace.truncated ? ' · stopped at budget' : ''}
        </p>
      </div>

      <SourceView
        source={files.find((file) => file.path === current?.file)?.contents ?? ''}
        current={current}
        steps={trace.steps}
      />

      <div className="scope__transport">
        <button
          type="button"
          className="button button--bare"
          onClick={() => setIndex(0)}
          disabled={index === 0}
          aria-label="First step"
        >
          ⏮
        </button>
        <button
          type="button"
          className="button button--bare"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
          aria-label="Previous step"
        >
          ◀
        </button>
        <input
          className="scope__slider"
          type="range"
          min={0}
          max={timeline.length - 1}
          value={index}
          aria-label="Execution step"
          onChange={(event) => setIndex(Number(event.target.value))}
        />
        <button
          type="button"
          className="button button--bare"
          onClick={() => setIndex((value) => Math.min(timeline.length - 1, value + 1))}
          disabled={index === timeline.length - 1}
          aria-label="Next step"
        >
          ▶
        </button>
      </div>

      <p className="scope__where numeral">
        {current?.file}:{current?.line} · {current?.function}
        {current?.detail ? ` → ${current.detail}` : ''}
      </p>

      <div>
        <p className="label">State here</p>
        {visible.size === 0 ? (
          <p className="empty">No values yet.</p>
        ) : (
          <ul className="scope__state">
            {[...visible].map(([name, value]) => (
              <li
                key={name}
                className={`scope__binding${
                  current?.changes && name in current.changes ? ' scope__binding--changed' : ''
                }`}
              >
                <span className="scope__name">{name}</span>
                <span className="scope__value">{value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {trace.error ? (
        <p className="notice notice--error">
          {trace.error.type}
          {trace.error.message ? `: ${trace.error.message}` : ''} — line {trace.error.line}
        </p>
      ) : null}

      {trace.stdout ? (
        <div>
          <p className="label">Output</p>
          <pre className="scope__output">{trace.stdout}</pre>
        </div>
      ) : null}

      <button type="button" className="button button--bare" onClick={onRun}>
        Record again
      </button>
    </section>
  );
}

/**
 * The source, annotated with how many times each line ran.
 *
 * The execution count is often the whole answer on its own: a loop body that
 * ran three times when the learner expected four is the single most common
 * iteration misconception, and it is visible here without stepping at all.
 */
function SourceView({
  source,
  current,
  steps,
}: {
  readonly source: string;
  readonly current: TraceStep | undefined;
  readonly steps: readonly TraceStep[];
}) {
  const counts = useMemo(() => {
    const tally = new Map<number, number>();
    for (const step of steps) {
      if (step.event !== 'line' || step.file !== current?.file) continue;
      tally.set(step.line, (tally.get(step.line) ?? 0) + 1);
    }
    return tally;
  }, [steps, current?.file]);

  return (
    <ol className="scope__source">
      {source.split('\n').map((text, offset) => {
        const line = offset + 1;
        const ran = counts.get(line) ?? 0;
        return (
          <li
            key={line}
            className={`scope__line${line === current?.line ? ' scope__line--current' : ''}`}
            aria-current={line === current?.line ? 'step' : undefined}
          >
            <span className="scope__gutter">{line}</span>
            <span className="scope__runs" title={ran === 1 ? 'ran once' : `ran ${ran} times`}>
              {ran > 0 ? `${ran}×` : ''}
            </span>
            <code className="scope__code">{text || ' '}</code>
          </li>
        );
      })}
    </ol>
  );
}
