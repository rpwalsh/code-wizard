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
  if (selector.startsWith('[') && selector.endsWith(']')) {
    return selector.slice(1, -1) in node.attributes;
  }
  if (selector.startsWith('.')) {
    // Class lists are space-separated words; substring matching is how
    // ".nav" ends up firing on class="navigation".
    const classes = (node.attributes['class'] ?? '').split(/\s+/u);
    return classes.includes(selector.slice(1));
  }
  return node.tag === selector;
}

export function distribute(
  nodes: readonly ContentNode[],
  slots: readonly string[],
): Map<string, ContentNode[]> {
  const placed = new Map<string, ContentNode[]>();
  for (const slot of slots) placed.set(slot, []);
  placed.set('default', []);

  for (const node of nodes) {
    // First match wins: a partition, so a node never renders twice.
    const slot = slots.find((selector) => matchesSelector(node, selector)) ?? 'default';
    (placed.get(slot) as ContentNode[]).push(node);
  }
  return placed;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/"/gu, '&quot;').replace(/</gu, '&lt;');
}

function escapeText(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;');
}

export function renderSlot(nodes: readonly ContentNode[]): string {
  return nodes
    .map((node) => {
      const attributes = Object.entries(node.attributes)
        .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
        .join('');
      return `<${node.tag}${attributes}>${escapeText(node.text)}</${node.tag}>`;
    })
    .join('');
}
