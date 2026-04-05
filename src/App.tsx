import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import FeedCard from './components/FeedCard';
import DashboardFeedToolbar, {
  type DashboardFeedFilter,
  type DashboardFeedSort
} from './components/DashboardFeedToolbar';
import TabNavigation from './components/TabNavigation';
import SearchTab from './components/SearchTab';
import MapTab from './components/MapTab';
import SettingsTab from './components/SettingsTab';
import HistoryPanel from './components/HistoryPanel';
import HistoryTab from './components/HistoryTab';
import useRSSFeeds from './hooks/useRSSFeeds';
import type { Feed } from './hooks/useRSSFeeds';
import './styles.css';

const DASH_FILTER_KEY = 'naija_rss_dash_filter_v1';
const DASH_SORT_KEY = 'naija_rss_dash_sort_v1';

function parseDashFilter(v: string | null): DashboardFeedFilter {
  return v === 'active' || v === 'errors' ? v : 'all';
}

function parseDashSort(v: string | null): DashboardFeedSort {
  const allowed: DashboardFeedSort[] = [
    'saved',
    'itemsDesc',
    'itemsAsc',
    'newDesc',
    'newAsc',
    'refreshedDesc',
    'refreshedAsc',
    'nameAsc',
    'nameDesc',
    'errorsFirst',
    'errorsLast'
  ];
  return allowed.includes(v as DashboardFeedSort) ? (v as DashboardFeedSort) : 'errorsLast';
}

function compareFeedName(a: Feed, b: Feed): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

function App() {
  const {
    feeds,
    refreshInterval,
    theme,
    notifications,
    sound,
    cardsPerRow,
    countdown,
    history,
    refreshAll,
    setRefreshInterval,
    setTheme,
    setNotifications,
    setSound,
    setCardsPerRow,
    toggleFeedExpansion,
    updateFeeds,
    resetToDefaults,
    fetchFeed
  } = useRSSFeeds();

  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allExpanded, setAllExpanded] = useState(false);
  const [draggedFeedId, setDraggedFeedId] = useState<string | null>(null);
  const [dashFilter, setDashFilter] = useState<DashboardFeedFilter>(() =>
    parseDashFilter(localStorage.getItem(DASH_FILTER_KEY))
  );
  const [dashSort, setDashSort] = useState<DashboardFeedSort>(() =>
    parseDashSort(localStorage.getItem(DASH_SORT_KEY))
  );

  useEffect(() => {
    localStorage.setItem(DASH_FILTER_KEY, dashFilter);
  }, [dashFilter]);

  useEffect(() => {
    localStorage.setItem(DASH_SORT_KEY, dashSort);
  }, [dashSort]);

  const activeFeedCount = useMemo(() => feeds.filter(f => f.status === 'ok').length, [feeds]);
  const inactiveFeedCount = useMemo(() => feeds.filter(f => f.status === 'err').length, [feeds]);

  const dashboardFeeds = useMemo(() => {
    let list = [...feeds];
    if (dashFilter === 'active') list = list.filter(f => f.status === 'ok');
    if (dashFilter === 'errors') list = list.filter(f => f.status === 'err');

    if (dashSort === 'itemsDesc') {
      list.sort((a, b) => {
        const d = b.items.length - a.items.length;
        return d !== 0 ? d : compareFeedName(a, b);
      });
    } else if (dashSort === 'itemsAsc') {
      list.sort((a, b) => {
        const d = a.items.length - b.items.length;
        return d !== 0 ? d : compareFeedName(a, b);
      });
    } else if (dashSort === 'newDesc') {
      list.sort((a, b) => {
        const d = b.newCount - a.newCount;
        return d !== 0 ? d : compareFeedName(a, b);
      });
    } else if (dashSort === 'newAsc') {
      list.sort((a, b) => {
        const d = a.newCount - b.newCount;
        return d !== 0 ? d : compareFeedName(a, b);
      });
    } else if (dashSort === 'refreshedDesc') {
      list.sort((a, b) => {
        const ta = a.lastRefresh?.getTime() ?? 0;
        const tb = b.lastRefresh?.getTime() ?? 0;
        const d = tb - ta;
        return d !== 0 ? d : compareFeedName(a, b);
      });
    } else if (dashSort === 'refreshedAsc') {
      list.sort((a, b) => {
        const ta = a.lastRefresh?.getTime() ?? Number.POSITIVE_INFINITY;
        const tb = b.lastRefresh?.getTime() ?? Number.POSITIVE_INFINITY;
        const d = ta - tb;
        return d !== 0 ? d : compareFeedName(a, b);
      });
    } else if (dashSort === 'nameAsc') {
      list.sort((a, b) => compareFeedName(a, b));
    } else if (dashSort === 'nameDesc') {
      list.sort((a, b) => compareFeedName(b, a));
    } else if (dashSort === 'errorsFirst') {
      const inactive = list.filter(f => f.status === 'err');
      const active = list.filter(f => f.status === 'ok');
      list = [...inactive, ...active];
    } else if (dashSort === 'errorsLast') {
      const active = list.filter(f => f.status === 'ok');
      const inactive = list.filter(f => f.status === 'err');
      list = [...active, ...inactive];
    }

    return list;
  }, [feeds, dashFilter, dashSort]);

  const handleThemeToggle = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const handlePreviewFeed = async () => {
    const url = prompt('View another RSS feed by URL (https://...)');
    if (!url) return;
    
    try {
      const items = await fetchFeed(url);
      alert(`Fetched ${items.length} items from:\n${url}\n\n(Use Settings → Add feed to save it.)`);
    } catch (error) {
      alert(`Failed to fetch:\n${url}\n\n${(error as Error).message}`);
    }
  };

  const handleUpdateSettings = (newSettings: any) => {
    if (newSettings.refreshInterval !== undefined) {
      setRefreshInterval(newSettings.refreshInterval);
    }
    if (newSettings.theme !== undefined) {
      setTheme(newSettings.theme);
    }
    if (newSettings.notifications !== undefined) {
      setNotifications(newSettings.notifications);
    }
    if (newSettings.sound !== undefined) {
      setSound(newSettings.sound);
    }
    if (newSettings.cardsPerRow !== undefined) {
      setCardsPerRow(newSettings.cardsPerRow);
    }
  };

  const handleToggleAllExpanded = () => {
    const newExpandedState = !allExpanded;
    setAllExpanded(newExpandedState);
    
    // Also update the feeds to ensure consistency
    updateFeeds(feeds.map(feed => ({
      ...feed,
      expanded: newExpandedState
    })));
  };

  const handleDragStart = (e: React.DragEvent, feedId: string) => {
    setDraggedFeedId(feedId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFeedId: string) => {
    e.preventDefault();
    
    if (!draggedFeedId || draggedFeedId === targetFeedId) {
      setDraggedFeedId(null);
      return;
    }

    const draggedIndex = feeds.findIndex(feed => feed.id === draggedFeedId);
    const targetIndex = feeds.findIndex(feed => feed.id === targetFeedId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedFeedId(null);
      return;
    }

    const newFeeds = [...feeds];
    const [draggedFeed] = newFeeds.splice(draggedIndex, 1);
    newFeeds.splice(targetIndex, 0, draggedFeed);

    updateFeeds(newFeeds);
    setDraggedFeedId(null);
  };

  const handleRemoveFeed = (feedId: string) => {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;
    if (!window.confirm(`Remove “${feed.name}” from your dashboard? You can add it again in Settings.`)) {
      return;
    }
    updateFeeds(feeds.filter(f => f.id !== feedId));
  };

  const handleRemoveAllInactiveFeeds = () => {
    if (inactiveFeedCount === 0) return;
    if (
      !window.confirm(
        `Remove all ${inactiveFeedCount} inactive feed${inactiveFeedCount === 1 ? '' : 's'}? This cannot be undone.`
      )
    ) {
      return;
    }
    updateFeeds(feeds.filter(f => f.status !== 'err'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={setRefreshInterval}
        onRefreshNow={refreshAll}
        countdown={countdown}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        notifications={notifications}
        onNotificationToggle={() => setNotifications(!notifications)}
        sound={sound}
        onSoundToggle={setSound}
        onHistoryToggle={() => setShowHistory(!showHistory)}
        onSettingsToggle={() => setActiveTab('settings')}
        allExpanded={allExpanded}
        onToggleAllExpanded={handleToggleAllExpanded}
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="app-main" role="main">
        {activeTab === 'dashboard' && (
          <>
            {feeds.length > 0 && (
              <DashboardFeedToolbar
                filter={dashFilter}
                sort={dashSort}
                onFilterChange={setDashFilter}
                onSortChange={setDashSort}
                totalFeeds={feeds.length}
                visibleCount={dashboardFeeds.length}
                activeCount={activeFeedCount}
                inactiveCount={inactiveFeedCount}
                onRemoveAllInactive={handleRemoveAllInactiveFeeds}
              />
            )}
            <section
              className="grid"
              aria-label="Feeds Grid"
              style={{
                gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`
              }}
            >
              {dashboardFeeds.map((feed) => (
                <FeedCard
                  key={feed.id}
                  feed={feed}
                  onToggleExpand={toggleFeedExpansion}
                  onPreviewFeed={handlePreviewFeed}
                  onRemove={handleRemoveFeed}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragging={draggedFeedId === feed.id}
                />
              ))}

              {feeds.length === 0 && (
                <div className="col-span-full flex items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No feeds configured. Click Settings to add RSS feeds.
                  </p>
                </div>
              )}

              {feeds.length > 0 && dashboardFeeds.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <p className="text-gray-600 dark:text-gray-300">
                    No feeds match this filter. Try <strong>All</strong> or another view.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDashFilter('all')}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                  >
                    Show all feeds
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'search' && (
          <SearchTab feeds={feeds} />
        )}

        {activeTab === 'map' && (
          <MapTab feeds={feeds} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            feeds={feeds}
            settings={{ refreshInterval, theme, notifications, sound, cardsPerRow }}
            onUpdateFeeds={updateFeeds}
            onUpdateSettings={handleUpdateSettings}
            onResetDefaults={resetToDefaults}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab history={history} />
        )}
      </main>

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
      />
    </div>
  );
}

export default App;