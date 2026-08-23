// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/**
 * A list page from three small components.
 */

export interface Article {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
}

export function Tag({ label }: { label: string }) {
  return null;
}

export function ArticleCard({ article }: { article: Article }) {
  return null;
}

export function ArticleList({
  articles,
  loading,
}: {
  articles: readonly Article[];
  loading: boolean;
}) {
  return null;
}
