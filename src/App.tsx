import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import FeedCard from './components/FeedCard';
import TabNavigation from './components/TabNavigation';
import SearchTab from './components/SearchTab';
import MapTab from './components/MapTab';
import SettingsTab from './components/SettingsTab';
import HistoryPanel from './components/HistoryPanel';
import HistoryTab from './components/HistoryTab';
import useRSSFeeds, { feedShowsOnDashboard } from './hooks/useRSSFeeds';
import DashboardFeedsTab from './components/DashboardFeedsTab';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ChevronRight,
  Globe2,
  Landmark,
  Layers,
  Mic2,
  Newspaper,
  PanelLeft,
  Radio,
  Tv
} from 'lucide-react';
import './styles.css';

/** Pick a recognizable icon from the outlet name (keyword heuristics). */
function readerSourceListIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes('bbc') || n.includes('rfi') || n.includes('hausa')) return Radio;
  if (n.includes('al jazeera') || n.includes('guardian') || n.includes('reuters')) return Globe2;
  if (n.includes('business') || n.includes('tribune') || n.includes('trust')) return Building2;
  if (n.includes('channels') || n.includes('tv')) return Tv;
  if (n.includes('pulse') || n.includes('thisday') || n.includes('live')) return Mic2;
  if (n.includes('nation') || n.includes('premium') || n.includes('times')) return Landmark;
  return Newspaper;
}

function ReaderSourceIconBadge({
  Icon,
  active
}: {
  Icon: LucideIcon;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        active
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
      }`}
      aria-hidden
    >
      <Icon className="h-4 w-4 shrink-0" />
    </span>
  );
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
    refreshFeed
  } = useRSSFeeds();

  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allExpanded, setAllExpanded] = useState(false);
  const [draggedFeedId, setDraggedFeedId] = useState<string | null>(null);
  const [selectedDashboardFeedId, setSelectedDashboardFeedId] = useState<string>('all');
  const [isReaderDrawerOpen, setIsReaderDrawerOpen] = useState(false);
  const [isReaderDrawerVisible, setIsReaderDrawerVisible] = useState(false);
  const [readerSourceQuery, setReaderSourceQuery] = useState('');
  const readerDrawerCloseTimerRef = useRef<number | null>(null);

  const dashboardFeeds = useMemo(
    () => feeds.filter(f => feedShowsOnDashboard(f)),
    [feeds]
  );

  const selectedDashboardFeed = useMemo(
    () => dashboardFeeds.find(feed => feed.id === selectedDashboardFeedId) ?? null,
    [dashboardFeeds, selectedDashboardFeedId]
  );

  const dashboardFeedCards = useMemo(
    () => selectedDashboardFeedId === 'all'
      ? dashboardFeeds
      : dashboardFeeds.filter(feed => feed.id === selectedDashboardFeedId),
    [dashboardFeeds, selectedDashboardFeedId]
  );

  const filteredReaderSources = useMemo(() => {
    const q = readerSourceQuery.trim().toLowerCase();
    if (!q) return dashboardFeeds;
    return dashboardFeeds.filter(feed => feed.name.toLowerCase().includes(q));
  }, [dashboardFeeds, readerSourceQuery]);

  const handleThemeToggle = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
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

  useEffect(() => {
    if (activeTab !== 'dashboard-reader' && isReaderDrawerOpen) {
      setIsReaderDrawerVisible(false);
      setIsReaderDrawerOpen(false);
    }
  }, [activeTab, isReaderDrawerOpen]);

  useEffect(() => {
    if (readerDrawerCloseTimerRef.current !== null) {
      window.clearTimeout(readerDrawerCloseTimerRef.current);
      readerDrawerCloseTimerRef.current = null;
    }
    if (isReaderDrawerOpen) {
      requestAnimationFrame(() => setIsReaderDrawerVisible(true));
    }
  }, [isReaderDrawerOpen]);

  useEffect(() => {
    return () => {
      if (readerDrawerCloseTimerRef.current !== null) {
        window.clearTimeout(readerDrawerCloseTimerRef.current);
      }
    };
  }, []);

  const openReaderDrawer = () => {
    setIsReaderDrawerOpen(true);
  };

  const closeReaderDrawer = () => {
    setIsReaderDrawerVisible(false);
    readerDrawerCloseTimerRef.current = window.setTimeout(() => {
      setIsReaderDrawerOpen(false);
      readerDrawerCloseTimerRef.current = null;
    }, 220);
  };

  useEffect(() => {
    if (selectedDashboardFeedId === 'all') return;
    const stillExists = dashboardFeeds.some(feed => feed.id === selectedDashboardFeedId);
    if (!stillExists) {
      setSelectedDashboardFeedId('all');
    }
  }, [dashboardFeeds, selectedDashboardFeedId]);

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
                  onRefreshFeed={() => refreshFeed(feed)}
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
                <div className="col-span-full flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                  <p className="text-gray-600 dark:text-gray-300">
                    No feeds are enabled for the home grid.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Turn sources on using the <strong>+ / −</strong> tab.
                  </p>
                </div>
              )}

            </section>
          </>
        )}

        {activeTab === 'dashboard-reader' && (
          <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]" aria-label="Reader Dashboard">
            <>
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={openReaderDrawer}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 active:translate-y-0 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900 dark:focus:ring-orange-700 dark:focus:ring-offset-gray-900"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                        <PanelLeft className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Sources
                        </span>
                        <span className="mt-1 block truncate">
                          {selectedDashboardFeed ? selectedDashboardFeed.name : 'All Sources'}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
                  </span>
                </button>

                {isReaderDrawerOpen && (
                  <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                      type="button"
                      aria-label="Close sources drawer"
                      className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isReaderDrawerVisible ? 'opacity-100' : 'opacity-0'}`}
                      onClick={closeReaderDrawer}
                    />

                    <div className={`absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto border-r border-gray-200 bg-white p-4 shadow-xl transition-transform duration-200 ease-out dark:border-gray-800 dark:bg-gray-950 ${isReaderDrawerVisible ? 'translate-x-0' : '-translate-x-full'}`}>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Sources
                          </h2>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Choose a newspaper to focus the feed view.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={closeReaderDrawer}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                        >
                          Close
                        </button>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="reader-sources-search-mobile" className="sr-only">
                          Search newspaper names
                        </label>
                        <input
                          id="reader-sources-search-mobile"
                          type="search"
                          value={readerSourceQuery}
                          onChange={e => setReaderSourceQuery(e.target.value)}
                          placeholder="Search newspaper..."
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-orange-600 dark:focus:ring-orange-900/40"
                        />
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDashboardFeedId('all');
                            closeReaderDrawer();
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${selectedDashboardFeedId === 'all'
                            ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900'
                          }`}
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <ReaderSourceIconBadge Icon={Layers} active={selectedDashboardFeedId === 'all'} />
                            <span className="font-medium">All Sources</span>
                          </span>
                          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{dashboardFeeds.length}</span>
                        </button>

                        {filteredReaderSources.map(feed => (
                          <button
                            key={feed.id}
                            type="button"
                            onClick={() => {
                              setSelectedDashboardFeedId(feed.id);
                              closeReaderDrawer();
                            }}
                            className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${selectedDashboardFeedId === feed.id
                              ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900'
                            }`}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2">
                              <ReaderSourceIconBadge
                                Icon={readerSourceListIcon(feed.name)}
                                active={selectedDashboardFeedId === feed.id}
                              />
                              <span className="min-w-0 font-medium">{feed.name}</span>
                            </span>
                            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{feed.items.length}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <aside className="hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:sticky lg:top-4 lg:block lg:self-start">
                <div className="mb-3 px-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Sources
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Choose a newspaper to focus the feed view.
                  </p>
                </div>

                <div className="mb-3 px-2">
                  <label htmlFor="reader-sources-search" className="sr-only">
                    Search newspaper names
                  </label>
                  <input
                    id="reader-sources-search"
                    type="search"
                    value={readerSourceQuery}
                    onChange={e => setReaderSourceQuery(e.target.value)}
                    placeholder="Search newspaper..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-orange-600 dark:focus:ring-orange-900/40"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDashboardFeedId('all')}
                    className={`gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors lg:flex lg:w-full lg:items-center lg:justify-between ${selectedDashboardFeedId === 'all'
                      ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900'
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <ReaderSourceIconBadge Icon={Layers} active={selectedDashboardFeedId === 'all'} />
                      <span className="font-medium">All Sources</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{dashboardFeeds.length}</span>
                  </button>

                  {filteredReaderSources.map(feed => (
                    <button
                      key={feed.id}
                      type="button"
                      onClick={() => setSelectedDashboardFeedId(feed.id)}
                      className={`gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors lg:flex lg:w-full lg:items-center lg:justify-between ${selectedDashboardFeedId === feed.id
                        ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900'
                      }`}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <ReaderSourceIconBadge
                          Icon={readerSourceListIcon(feed.name)}
                          active={selectedDashboardFeedId === feed.id}
                        />
                        <span className="min-w-0 font-medium">{feed.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{feed.items.length}</span>
                    </button>
                  ))}
                </div>
              </aside>
            </>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-4">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                      {selectedDashboardFeed ? selectedDashboardFeed.name : 'All Sources'}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                      {selectedDashboardFeed
                        ? 'Single-source view'
                        : 'Browse all enabled sources'}
                    </p>
                  </div>

                  <div className="flex w-full sm:w-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDashboardFeed) {
                          refreshFeed(selectedDashboardFeed);
                        } else {
                          refreshAll();
                        }
                      }}
                      className="w-full rounded-xl bg-orange-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 sm:w-auto"
                    >
                      {selectedDashboardFeed ? `Refresh ${selectedDashboardFeed.name}` : 'Refresh All'}
                    </button>
                  </div>
                </div>
              </div>

              {dashboardFeedCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
                  No feeds available for this layout yet.
                </div>
              ) : (
                <section className="space-y-4" aria-label="Reader Feed Cards">
                  {dashboardFeedCards.map(feed => (
                    <FeedCard
                      key={feed.id}
                      feed={feed}
                      onToggleExpand={toggleFeedExpansion}
                      onRefreshFeed={() => refreshFeed(feed)}
                      onRemove={handleRemoveFeed}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      isDragging={draggedFeedId === feed.id}
                    />
                  ))}
                </section>
              )}
            </div>
          </section>
        )}

        {activeTab === 'dashboard-feeds' && (
          <DashboardFeedsTab
            feeds={feeds}
            onUpdateFeeds={updateFeeds}
            onRefreshFeed={refreshFeed}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab feeds={feeds.filter(feedShowsOnDashboard)} />
        )}

        {activeTab === 'map' && (
          <MapTab feeds={feeds.filter(feedShowsOnDashboard)} />
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