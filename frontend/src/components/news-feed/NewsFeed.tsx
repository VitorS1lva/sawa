import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/card/Card";
import type { NewsItem, NewsSentiment } from "@/lib/api/types";
import { newsFeedConfig as config } from "./newsFeed.config";
import styles from "./NewsFeed.module.css";

type NewsFeedProps = {
  items?: NewsItem[];
  isLoading: boolean;
  isError: boolean;
  className?: string;
};

const sentimentIcons: Record<NewsSentiment, typeof ArrowRight> = {
  positive: ArrowUpRight,
  neutral: ArrowRight,
  negative: ArrowDownRight,
};

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

/** "há 3 horas", "ontem"... */
function timeAgo(iso: string) {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

/** Feed de notícias já coletadas e analisadas pelo back-end. */
export function NewsFeed({ items = [], isLoading, isError, className }: NewsFeedProps) {
  let body;
  if (isLoading) {
    body = <p className={styles.status}>Carregando...</p>;
  } else if (isError) {
    body = (
      <p className={styles.status} role="alert">
        {config.errorText}
      </p>
    );
  } else if (items.length === 0) {
    body = <p className={styles.status}>{config.emptyText}</p>;
  } else {
    body = (
      <ul className={styles.list}>
        {items.map((item) => {
          const Icon = item.sentiment && sentimentIcons[item.sentiment];

          return (
            <li key={item.id}>
              <article className={styles.item}>
                <p className={styles.meta}>
                  <span>{item.source}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={item.publishedAt}>{timeAgo(item.publishedAt)}</time>
                  {item.sentiment && Icon && (
                    <span className={styles.sentiment} data-sentiment={item.sentiment}>
                      <Icon aria-hidden="true" />
                      {config.sentiment[item.sentiment]}
                    </span>
                  )}
                </p>
                <h3 className={styles.headline}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h3>
                {item.summary && <p className={styles.summary}>{item.summary}</p>}
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Card title={config.title} className={className}>
      <div className={styles.scroll}>{body}</div>
    </Card>
  );
}
