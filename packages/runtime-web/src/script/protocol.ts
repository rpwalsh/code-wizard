// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * The wire format between the page and the script worker.
 *
 * Separate from the Python protocol on purpose. That one carries an
 * interpreter's boot configuration — an index URL, host helpers, packages to
 * install — none of which means anything here, because the browser already
 * *is* the runtime for this language. Sharing a protocol between the two would
 * mean a union whose fields are meaningless in one arm and required in the
 * other, which is how a boundary stops being checkable.
 *
 * Plain data throughout: structured clone has to carry it, and keeping the
 * boundary dumb is what lets the worker be terminated at any instant without
 * the page holding a stale object graph.
 */
export interface ScriptFile {
  readonly path: string;
  readonly contents: string;
}

export type ScriptRequest =
  | {
      readonly id: number;
      readonly kind: 'execute';
      readonly files: readonly ScriptFile[];
      readonly entryPoint: string;
      readonly maxOutputBytes: number;
    }
  | {
      readonly id: number;
      readonly kind: 'test';
      readonly files: readonly ScriptFile[];
      readonly testFiles: readonly string[];
      readonly maxOutputBytes: number;
    };

export type ScriptCall =
  | Omit<Extract<ScriptRequest, { kind: 'execute' }>, 'id'>
  | Omit<Extract<ScriptRequest, { kind: 'test' }>, 'id'>;

export interface ScriptOutput {
  readonly stdout: string;
  readonly stderr: string;
  readonly truncated: boolean;
}

export interface ScriptExecuteResult extends ScriptOutput {
  readonly exitCode: number;
}

export interface ScriptTestResult extends ScriptOutput {
  /** The shared report document, as text, exactly as a harness would write it. */
  readonly report: string;
}

export type ScriptResponse =
  | {
      readonly id: number;
      readonly ok: true;
      readonly kind: 'execute';
      readonly result: ScriptExecuteResult;
    }
  | {
      readonly id: number;
      readonly ok: true;
      readonly kind: 'test';
      readonly result: ScriptTestResult;
    }
  | { readonly id: number; readonly ok: false; readonly error: string };

/**
 * A bounded sink for whatever the learner's code prints.
 *
 * Shared by the worker and by anything else that has to accept unbounded
 * output from untrusted code. Once the cap is reached, further text is counted
 * and dropped rather than buffered — an infinite `console.log` must not be
 * able to exhaust the tab's memory before the timeout can fire.
 */
export class BoundedText {
  #parts: string[] = [];
  #size = 0;
  #truncated = false;

  constructor(private readonly limit: number) {}

  push(text: string): void {
    if (this.#size >= this.limit) {
      this.#truncated = true;
      return;
    }

    const room = this.limit - this.#size;
    if (text.length <= room) {
      this.#parts.push(text);
      this.#size += text.length;
      return;
    }

    this.#parts.push(text.slice(0, room));
    this.#size = this.limit;
    this.#truncated = true;
  }

  get text(): string {
    return this.#parts.join('');
  }

  get truncated(): boolean {
    return this.#truncated;
  }
}
