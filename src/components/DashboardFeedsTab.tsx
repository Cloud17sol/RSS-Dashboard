import React, { useState } from 'react';
import { ListPlus, Settings } from 'lucide-react';
import { feedShowsOnDashboard, type Feed } from '../hooks/useRSSFeeds';

interface DashboardFeedsTabProps {
  feeds: Feed[];
  onUpdateFeeds: (feeds: Feed[]) => void;
  onRefreshFeed: (feed: Feed) => Promise<void>;
  onOpenSettings: () => void;
}

const DashboardFeedsTab: React.FC<DashboardFeedsTabProps> = ({
  feeds,
  onUpdateFeeds,
  onRefreshFeed,
  onOpenSettings
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleDashboard = async (feed: Feed) => {
    const nextShow = !feedShowsOnDashboard(feed);
    const nextFeeds = feeds.map(f =>
      f.id === feed.id ? { ...f, showOnDashboard: nextShow } : f
    );
    onUpdateFeeds(nextFeeds);
    if (nextShow) {
      const updated = nextFeeds.find(f => f.id === feed.id);
      if (updated) {
        setLoadingId(feed.id);
        try {
          await onRefreshFeed(updated);
        } finally {
          setLoadingId(null);
        }
      }
    }
  };

  const shown = feeds.filter(feedShowsOnDashboard).length;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-950/50">
            <ListPlus className="h-7 w-7 text-orange-600 dark:text-orange-400" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard cards (+/−)</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Turn sources on or off for the home grid. Off still keeps the feed in{' '}
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 font-medium text-orange-600 underline decoration-orange-400/60 hover:decoration-orange-500 dark:text-orange-400"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden />
                Settings
              </button>
              ; only enabled feeds are fetched on refresh (faster).
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Showing on dashboard: <span className="font-semibold text-gray-700 dark:text-gray-300">{shown}</span> of{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">{feeds.length}</span>
            </p>
          </div>
        </div>
      </div>

      {feeds.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-gray-600 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
          No feeds yet. Add RSS URLs in Settings first.
        </p>
      ) : (
        <ul className="space-y-2" role="list">
          {feeds.map(feed => {
            const on = feedShowsOnDashboard(feed);
            const connected = feed.status === 'ok';
            const busy = loadingId === feed.id;

            return (
              <li
                key={feed.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{feed.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{feed.url}</p>
                  <p className="mt-2 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        connected
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {connected ? 'Connected' : 'Inactive'}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {on ? 'On dashboard' : 'Off dashboard'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500" aria-hidden>
                      −
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      disabled={busy}
                      onClick={() => toggleDashboard(feed)}
                      className={`relative inline-flex h-9 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                        on ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                      } ${busy ? 'cursor-wait opacity-70' : ''}`}
                      title={on ? 'Remove from dashboard (−)' : 'Add to dashboard (+)'}
                    >
                      <span
                        className={`inline-block h-7 w-7 translate-x-0.5 transform rounded-full bg-white shadow transition-transform ${
                          on ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                      <span className="sr-only">{on ? 'Remove from dashboard' : 'Add to dashboard'}</span>
                    </button>
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500" aria-hidden>
                      +
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DashboardFeedsTab;
