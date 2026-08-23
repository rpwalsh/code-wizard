// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * ng-content as a sorting machine: selectors, slots, and escaped output.
 */

export interface ContentNode {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string;
}

export function matchesSelector(node: ContentNode, selector: string): boolean {
  throw new Error('not implemented');
}

export function distribute(
  nodes: readonly ContentNode[],
  slots: readonly string[],
): Map<string, ContentNode[]> {
  throw new Error('not implemented');
}

export function renderSlot(nodes: readonly ContentNode[]): string {
  throw new Error('not implemented');
}
