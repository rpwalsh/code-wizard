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
  return <span className="tag">{label}</span>;
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article>
      <h2>{article.title}</h2>
      <p>{article.summary}</p>
      {article.tags.length > 0 && (
        <ul className="tags">
          {article.tags.map((tag) => (
            <li key={tag}>
              <Tag label={tag} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ArticleList({
  articles,
  loading,
}: {
  articles: readonly Article[];
  loading: boolean;
}) {
  // Three states, three returns: the code is the same shape as the decision.
  if (loading) return <p className="status">Loading…</p>;
  if (articles.length === 0) return <p className="status">No articles yet</p>;

  return (
    <section>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </section>
  );
}
