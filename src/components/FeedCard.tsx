import React, { useRef, useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  Minus,
  Plus,
  GripVertical,
  Trash2,
  LayoutGrid,
  List
} from 'lucide-react';

/** Headline count cycle for the expand button (default 20): 20 → 30 → 50 → 100 → 10 → 20 */
const HEADLINE_LIMIT_STEPS = [10, 20, 30, 50, 100] as const;

interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  content: string;
}

interface Feed {
  id: string;
  name: string;
  url: string;
  items: FeedItem[];
  lastRefresh?: Date;
  status: 'ok' | 'err';
  newCount: number;
  loading?: boolean;
  expanded?: boolean;
}

/** Compensate layout shift so the clicked row stays at the same viewport Y. */
function applyScrollDeltaForElement(el: HTMLElement, deltaY: number) {
  if (Math.abs(deltaY) < 0.5) return;
  const html = document.documentElement;
  const prevBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';

  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (
      /(auto|scroll|overlay)/.test(overflowY) &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      node.scrollTop += deltaY;
      html.style.scrollBehavior = prevBehavior;
      return;
    }
    node = node.parentElement;
  }

  const sc = document.scrollingElement;
  if (sc) {
    sc.scrollTop += deltaY;
  } else {
    window.scrollBy(0, deltaY);
  }
  html.style.scrollBehavior = prevBehavior;
}

interface FeedCardProps {
  feed: Feed;
  onToggleExpand: (feedId: string) => void;
  onRefreshFeed: () => void;
  onRemove?: (feedId: string) => void;
  onDragStart?: (e: React.DragEvent, feedId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetFeedId: string) => void;
  isDragging?: boolean;
}

const FeedCard: React.FC<FeedCardProps> = ({ 
  feed, 
  onToggleExpand, 
  onRefreshFeed,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [displayLimit, setDisplayLimit] = useState(20);
  /** Article list layout: two columns by default. */
  const [articleColumns, setArticleColumns] = useState<'one' | 'two'>('two');
  const itemRefs = useRef<Record<number, HTMLLIElement | null>>({});

  // Use feed.expanded to determine if card is collapsed
  const effectivelyCollapsed = !feed.expanded;

  const formatTime = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const toggleItemExpand = (index: number) => {
    const itemEl = itemRefs.current[index];
    const topBeforeToggle = itemEl?.getBoundingClientRect().top;

    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });

    if (typeof topBeforeToggle !== 'number') return;

    // Wait for React commit + layout (grid reflow). Double rAF beats one frame of layout lag.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const currentEl = itemRefs.current[index];
        if (!currentEl) return;
        const topAfterToggle = currentEl.getBoundingClientRect().top;
        const scrollDelta = topAfterToggle - topBeforeToggle;
        applyScrollDeltaForElement(currentEl, scrollDelta);
      });
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const displayItems = Math.min(feed.items.length, displayLimit);

  const getNextDisplayLimit = (): number => {
    const i = HEADLINE_LIMIT_STEPS.indexOf(
      displayLimit as (typeof HEADLINE_LIMIT_STEPS)[number]
    );
    if (i === -1) return 20;
    return HEADLINE_LIMIT_STEPS[(i + 1) % HEADLINE_LIMIT_STEPS.length];
  };

  /** Label shows the next limit after clicking (same pattern as before). */
  const getNextHeadlinesLabel = (): string => {
    const i = HEADLINE_LIMIT_STEPS.indexOf(
      displayLimit as (typeof HEADLINE_LIMIT_STEPS)[number]
    );
    if (i === -1) return '20';
    return String(HEADLINE_LIMIT_STEPS[(i + 1) % HEADLINE_LIMIT_STEPS.length]);
  };

  return (
    <article 
      className={`card ${isDragging ? 'opacity-50' : ''}`} 
      tabIndex={0}
      draggable
      onDragStart={(e) => onDragStart?.(e, feed.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(e, feed.id);
      }}
    >
      <header className="card-header">
        <div className="flex items-center gap-2 cursor-move">
          <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleExpand(feed.id)}
            className="p-1 hover:bg-orange-50 dark:hover:bg-orange-950 rounded transition-colors text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
            aria-label={effectivelyCollapsed ? 'Expand card' : 'Collapse card'}
          >
            {effectivelyCollapsed ? (
              <Plus className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
          </button>
          <h3 className="paper-name">{feed.name}</h3>
        </div>
        <div className="status-wrap">
          <span 
            className={`status-dot ${feed.status}`} 
            title="Connection status"
          />
          <span className="badge" title="Total items" aria-live="polite">
            {feed.items?.length || 0}
          </span>
          <button
            type="button"
            onClick={onRefreshFeed}
            className="ml-1 rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
            title={`Refresh ${feed.name}`}
            aria-label={`Refresh ${feed.name}`}
          >
            Refresh
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(feed.id)}
              className="ml-1 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
              title="Remove feed from dashboard"
              aria-label={`Remove ${feed.name} from dashboard`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
      
      {!effectivelyCollapsed && (
        <>
          <div className="meta">
        <span className="refresh-time" aria-live="polite">
          {feed.lastRefresh ? `Refreshed: ${formatTime(feed.lastRefresh)}` : 'Not refreshed yet'}
        </span>
        <span className="count">{feed.items?.length || 0} items</span>
          </div>
      
          <div className="actions-wrap" aria-label="Article display options">
            <p className="actions-title">Article display options</p>
            <div className="actions">
            <button
              type="button"
              className="btn btn-option"
              onClick={() => setArticleColumns(c => (c === 'two' ? 'one' : 'two'))}
              aria-pressed={articleColumns === 'two'}
              title={
                articleColumns === 'two'
                  ? 'Show articles in one column'
                  : 'Show articles in two columns'
              }
            >
              {articleColumns === 'two' ? (
                <>
                  <LayoutGrid className="w-4 h-4 inline mr-1" aria-hidden />
                  Layout: 2 columns
                </>
              ) : (
                <>
                  <List className="w-4 h-4 inline mr-1" aria-hidden />
                  Layout: 1 column
                </>
              )}
            </button>
            <button
              className="btn btn-option btn-expand"
              onClick={() => setDisplayLimit(getNextDisplayLimit())}
            >
              <ChevronDown className="w-4 h-4 inline mr-1" />
              Headlines: {getNextHeadlinesLabel()}
            </button>
            </div>
          </div>
      
          <div 
        className="progress" 
        style={{
          opacity: feed.loading ? '1' : '0',
          width: feed.loading ? '90%' : '0%'
        }}
        aria-hidden="true"
          />
      
          <ul
            className={`feed-list ${articleColumns === 'two' ? 'feed-list--cols-2' : 'feed-list--cols-1'}`}
            role="list"
          >
        {feed.items.slice(0, displayItems).map((item, index) => (
          <li
            key={index}
            className={`feed-item ${expandedItems.has(index) ? 'feed-item--expanded' : ''}`}
            ref={el => {
              itemRefs.current[index] = el;
            }}
          >
            <p className="feed-title">{item.title}</p>
            <div className="feed-meta">
              {item.pubDate ? formatTime(new Date(item.pubDate)) : '—'}
            </div>
            <div className="feed-actions">
              <a
                href={item.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                <ExternalLink className="w-4 h-4 inline mr-1" />
                Open
              </a>
              <button
                className="btn"
                onClick={() => toggleItemExpand(index)}
              >
                {expandedItems.has(index) ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {expandedItems.has(index) && (
              <div className="feed-full" style={{ marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.35' }}>
                {stripHtml(item.content) || '(no content)'}
              </div>
            )}
          </li>
        ))}
          </ul>
        </>
      )}
    </article>
  );
};

export default FeedCard;