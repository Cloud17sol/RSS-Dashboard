import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, MoreHorizontal, Minus, Plus, GripVertical } from 'lucide-react';

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

interface FeedCardProps {
  feed: Feed;
  onToggleExpand: (feedId: string) => void;
  onPreviewFeed: () => void;
  onDragStart?: (e: React.DragEvent, feedId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetFeedId: string) => void;
  isDragging?: boolean;
}

const FeedCard: React.FC<FeedCardProps> = ({ 
  feed, 
  onToggleExpand, 
  onPreviewFeed,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [displayLimit, setDisplayLimit] = useState(10);

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
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const displayItems = Math.min(feed.items.length, displayLimit);

  const getNextDisplayLimit = () => {
    if (displayLimit === 10) return 20;
    if (displayLimit === 20) return 30;
    return 10;
  };

  const getDisplayLimitText = () => {
    if (displayLimit === 10) return 'Show 20';
    if (displayLimit === 20) return 'Show 30';
    return 'Show 10';
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
          {feed.newCount > 0 && (
            <span className="badge" title="New items" aria-live="polite">
              {feed.newCount}
            </span>
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
      
          <div className="actions">
            <button
              className="btn ghost btn-expand"
              onClick={() => setDisplayLimit(getNextDisplayLimit())}
            >
              <ChevronDown className="w-4 h-4 inline mr-1" />
              {getDisplayLimitText()}
            </button>
        <button className="btn ghost btn-more" onClick={onPreviewFeed}>
          <MoreHorizontal className="w-4 h-4 inline mr-1" />
          More
        </button>
          </div>
      
          <div 
        className="progress" 
        style={{
          opacity: feed.loading ? '1' : '0',
          width: feed.loading ? '90%' : '0%'
        }}
        aria-hidden="true"
          />
      
          <ul className="feed-list" role="list">
        {feed.items.slice(0, displayItems).map((item, index) => (
          <li key={index} className="feed-item">
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