import React, { useState, useMemo } from 'react';
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
import './styles.css';

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
    fetchFeed,
    refreshFeed
  } = useRSSFeeds();

  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allExpanded, setAllExpanded] = useState(false);
  const [draggedFeedId, setDraggedFeedId] = useState<string | null>(null);

  const dashboardFeeds = useMemo(
    () => feeds.filter(f => feedShowsOnDashboard(f)),
    [feeds]
  );

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