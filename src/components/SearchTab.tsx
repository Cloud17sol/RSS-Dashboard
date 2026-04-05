import React, { useState, useMemo, Fragment } from 'react';
import { Search, Filter, Calendar, ExternalLink, X } from 'lucide-react';

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

interface SearchResult {
  feedId: string;
  feedName: string;
  item: FeedItem;
  matchType: 'title' | 'content' | 'newspaper';
  matchText: string;
}

interface SearchTabProps {
  feeds: Feed[];
}

const SearchTab: React.FC<SearchTabProps> = ({ feeds }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const formatTime = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

    // With one capturing group, split() puts matches at odd indexes — do not use
    // regex.test() in a loop with the /g flag (lastIndex breaks alternating calls).
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      )
    );
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    const feedsToSearch = selectedFeeds.length > 0 
      ? feeds.filter(feed => selectedFeeds.includes(feed.id))
      : feeds;

    feedsToSearch.forEach(feed => {
      const feedNameLower = feed.name.toLowerCase();
      const feedNameMatches = feedNameLower.includes(query);

      feed.items.forEach(item => {
        const title = item.title.toLowerCase();
        const content = stripHtml(item.content).toLowerCase();
        
        // Apply date filter
        if (dateFilter !== 'all' && item.pubDate) {
          const itemDate = new Date(item.pubDate);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dateFilter === 'today' && daysDiff > 0) return;
          if (dateFilter === 'week' && daysDiff > 7) return;
          if (dateFilter === 'month' && daysDiff > 30) return;
        }

        // Check for matches (title/content first; newspaper name lists all articles from that source)
        if (title.includes(query)) {
          results.push({
            feedId: feed.id,
            feedName: feed.name,
            item,
            matchType: 'title',
            matchText: item.title
          });
        } else if (content.includes(query)) {
          // Find the sentence containing the match for context
          const sentences = content.split(/[.!?]+/);
          const matchingSentence = sentences.find(sentence => 
            sentence.toLowerCase().includes(query)
          );
          
          results.push({
            feedId: feed.id,
            feedName: feed.name,
            item,
            matchType: 'content',
            matchText: matchingSentence?.trim() || content.substring(0, 200)
          });
        } else if (feedNameMatches) {
          results.push({
            feedId: feed.id,
            feedName: feed.name,
            item,
            matchType: 'newspaper',
            matchText: feed.name
          });
        }
      });
    });

    // Sort results
    if (sortBy === 'date') {
      results.sort((a, b) => {
        const dateA = a.item.pubDate ? new Date(a.item.pubDate).getTime() : 0;
        const dateB = b.item.pubDate ? new Date(b.item.pubDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'feed') {
      results.sort((a, b) => a.feedName.localeCompare(b.feedName));
    }
    // Default is relevance (title matches first, then content matches)

    return results;
  }, [searchQuery, selectedFeeds, dateFilter, sortBy, feeds]);

  const handleFeedToggle = (feedId: string) => {
    setSelectedFeeds(prev => 
      prev.includes(feedId) 
        ? prev.filter(id => id !== feedId)
        : [...prev, feedId]
    );
  };

  const clearFilters = () => {
    setSelectedFeeds([]);
    setDateFilter('all');
    setSortBy('relevance');
  };

  return (
    <div className="search-tab">
      <div className="search-header">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search by keyword, topic, or newspaper name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="clear-search"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'primary' : 'ghost'}`}
        >
          <Filter className="w-4 h-4 inline mr-1" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="search-filters">
          <div className="filter-section">
            <h4>Feeds</h4>
            <div className="feed-checkboxes">
              {feeds.map(feed => (
                <label key={feed.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedFeeds.includes(feed.id)}
                    onChange={() => handleFeedToggle(feed.id)}
                  />
                  <span>{feed.name}</span>
                  <span className="feed-count">({feed.items.length})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4>Date Range</h4>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
            </select>
          </div>

          <div className="filter-section">
            <h4>Sort by</h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="feed">Feed</option>
            </select>
          </div>

          <button onClick={clearFilters} className="btn ghost">
            Clear Filters
          </button>
        </div>
      )}

      <div className="search-results">
        {searchQuery && (
          <div className="search-summary">
            <p>
              Found <strong>{searchResults.length}</strong> result{searchResults.length !== 1 ? 's' : ''} 
              {searchQuery && <> for "<strong>{searchQuery}</strong>"</>}
              {selectedFeeds.length > 0 && (
                <> in {selectedFeeds.length} selected feed{selectedFeeds.length !== 1 ? 's' : ''}</>
              )}
            </p>
          </div>
        )}

        {searchResults.length === 0 && searchQuery && (
          <div className="no-results">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3>No results found</h3>
            <p>Try adjusting your search terms or filters</p>
          </div>
        )}

        {searchResults.length === 0 && !searchQuery && (
          <div className="search-placeholder">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3>Search Nigerian News</h3>
            <p>Enter keywords or a newspaper name to search across your RSS feeds</p>
            <div className="search-tips">
              <h4>Search Tips:</h4>
              <ul>
                <li>Type part of a newspaper name to see all articles from that feed</li>
                <li>Use specific keywords for better results</li>
                <li>Filter by specific feeds to narrow results</li>
                <li>Use date filters to find recent articles</li>
                <li>Sort by date to see the latest matches first</li>
              </ul>
            </div>
          </div>
        )}

        <div className="results-list">
          {searchResults.map((result, index) => (
            <article key={index} className="search-result-card">
              <div className="result-header">
                <span className="feed-badge">{highlightText(result.feedName, searchQuery)}</span>
                <span className="match-type-badge">
                  {result.matchType === 'title'
                    ? 'Title'
                    : result.matchType === 'content'
                      ? 'Content'
                      : 'Newspaper'}
                </span>
              </div>
              
              <h3 className="result-title">
                {highlightText(result.item.title, searchQuery)}
              </h3>
              
              <div className="result-meta">
                <Calendar className="w-4 h-4 inline mr-1" />
                {result.item.pubDate ? formatTime(new Date(result.item.pubDate)) : 'No date'}
              </div>
              
              <div className="result-excerpt">
                {result.matchType === 'content' ? (
                  <p>{highlightText(result.matchText, searchQuery)}...</p>
                ) : (
                  <p>{stripHtml(result.item.content).substring(0, 200)}...</p>
                )}
              </div>
              
              <div className="result-actions">
                <a
                  href={result.item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn primary"
                >
                  <ExternalLink className="w-4 h-4 inline mr-1" />
                  Read Article
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchTab;