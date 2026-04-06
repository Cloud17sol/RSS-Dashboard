import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export interface TodaysHeadlineArticle {
  id: string;
  title: string;
  link: string;
  feedName: string;
  firstSeenAt: Date;
}

interface TodaysHeadlinesCardProps {
  items: TodaysHeadlineArticle[];
  totalCount: number;
}

const TodaysHeadlinesCard: React.FC<TodaysHeadlinesCardProps> = ({ items, totalCount }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <article className="card" tabIndex={0} aria-label="Today's Headlines">
      <header className="card-header">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="shrink-0 rounded p-1 text-gray-600 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-orange-950 dark:hover:text-orange-400"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse headlines section' : 'Expand headlines section'}
          >
            {expanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
          <h3 className="paper-name truncate">{"Today's Headlines"}</h3>
        </div>
        <div className="status-wrap">
          <span className="badge" title="Headlines today" aria-live="polite">
            {totalCount}
          </span>
        </div>
      </header>

      {expanded && (
        <>
          <div className="meta">
            <span className="refresh-time">
              Captured throughout the day from your enabled RSS sources.
            </span>
          </div>

          <ul className="feed-list feed-list--cols-1" role="list">
            {items.map(article => (
              <li key={article.id} className="feed-item">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-inherit no-underline"
                >
                  <p className="feed-title">{article.title}</p>
                  <div className="feed-meta">
                    <span>{article.feedName}</span>
                    <span aria-hidden>•</span>
                    <span>
                      {article.firstSeenAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
};

export default TodaysHeadlinesCard;
