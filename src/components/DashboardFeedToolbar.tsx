import React from 'react';
import { Filter, Trash2, ListOrdered, AlertTriangle } from 'lucide-react';

export type DashboardFeedFilter = 'all' | 'active' | 'errors';
export type DashboardFeedSort =
  | 'saved'
  | 'itemsDesc'
  | 'itemsAsc'
  | 'newDesc'
  | 'newAsc'
  | 'refreshedDesc'
  | 'refreshedAsc'
  | 'nameAsc'
  | 'nameDesc'
  | 'errorsFirst'
  | 'errorsLast';

interface DashboardFeedToolbarProps {
  filter: DashboardFeedFilter;
  sort: DashboardFeedSort;
  onFilterChange: (f: DashboardFeedFilter) => void;
  onSortChange: (s: DashboardFeedSort) => void;
  totalFeeds: number;
  visibleCount: number;
  activeCount: number;
  inactiveCount: number;
  onRemoveAllInactive: () => void;
}

const DashboardFeedToolbar: React.FC<DashboardFeedToolbarProps> = ({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  totalFeeds,
  visibleCount,
  activeCount,
  inactiveCount,
  onRemoveAllInactive
}) => {
  const filterBtn = (key: DashboardFeedFilter, label: string, count?: number) => (
    <button
      type="button"
      onClick={() => onFilterChange(key)}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
        filter === key
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
      }`}
      aria-pressed={filter === key}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1 tabular-nums opacity-90 ${filter === key ? 'text-white/90' : ''}`}>
          ({count})
        </span>
      )}
    </button>
  );

  return (
    <div
      className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      role="region"
      aria-label="Filter and sort feeds"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <Filter className="h-3.5 w-3.5" aria-hidden />
          Show
        </span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Feed status filter">
          {filterBtn('all', 'All', totalFeeds)}
          {filterBtn('active', 'Active', activeCount)}
          {filterBtn('errors', 'Inactive', inactiveCount)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <ListOrdered className="h-3.5 w-3.5" aria-hidden />
          Sort
        </label>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as DashboardFeedSort)}
          className="min-w-[11rem] max-w-[min(100%,20rem)] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:min-w-[13rem] sm:text-sm"
          aria-label="Sort feed cards"
        >
          <option value="saved">Saved order (drag)</option>
          <optgroup label="By card stats">
            <option value="itemsDesc">Most headlines</option>
            <option value="itemsAsc">Fewest headlines</option>
            <option value="newDesc">Most new (orange badge)</option>
            <option value="newAsc">Fewest new</option>
            <option value="refreshedDesc">Recently refreshed</option>
            <option value="refreshedAsc">Oldest refresh</option>
          </optgroup>
          <optgroup label="Name">
            <option value="nameAsc">A–Z</option>
            <option value="nameDesc">Z–A</option>
          </optgroup>
          <optgroup label="Status">
            <option value="errorsFirst">Inactive first</option>
            <option value="errorsLast">Inactive last</option>
          </optgroup>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <button
          type="button"
          onClick={onRemoveAllInactive}
          disabled={inactiveCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70 sm:text-sm"
          title="Permanently remove every inactive feed from your list"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Remove all inactive
        </button>
      </div>

      <p className="w-full text-center text-xs text-gray-500 dark:text-gray-400 sm:text-left">
        Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{visibleCount}</span> of{' '}
        <span className="font-semibold text-gray-800 dark:text-gray-200">{totalFeeds}</span> feeds
        {filter !== 'all' && (
          <span className="ml-1 inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            filter on
          </span>
        )}
      </p>
    </div>
  );
};

export default DashboardFeedToolbar;
