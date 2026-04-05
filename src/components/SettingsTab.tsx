import React, { useState } from 'react';
import { Upload, Download, RotateCcw, CreditCard as Edit, Trash2, Plus, Settings as SettingsIcon } from 'lucide-react';
import { stableFeedId } from '../lib/feedId';
import type { Feed } from '../hooks/useRSSFeeds';

interface Settings {
  refreshInterval: number;
  theme: string;
  notifications: boolean;
  sound: boolean;
  cardsPerRow: number;
}

interface SettingsTabProps {
  feeds: Feed[];
  settings: Settings;
  onUpdateFeeds: (feeds: Feed[]) => void;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onResetDefaults: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  feeds,
  settings,
  onUpdateFeeds,
  onUpdateSettings,
  onResetDefaults,
}) => {
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedName.trim() || !feedUrl.trim()) {
      alert('Please provide a valid name and URL');
      return;
    }

    const existingFeedIndex = feeds.findIndex(
      f => f.name.toLowerCase() === feedName.toLowerCase()
    );

    const urlNorm = feedUrl.trim();
    if (existingFeedIndex >= 0) {
      // Update existing feed (id follows URL so "seen" state stays correct)
      const updatedFeeds = [...feeds];
      updatedFeeds[existingFeedIndex] = {
        ...updatedFeeds[existingFeedIndex],
        id: stableFeedId(urlNorm),
        name: feedName.trim(),
        url: urlNorm,
        items: [],
        newCount: 0,
        showOnDashboard: updatedFeeds[existingFeedIndex].showOnDashboard
      };
      onUpdateFeeds(updatedFeeds);
    } else {
      // Add new feed
      const newFeed: Feed = {
        id: stableFeedId(urlNorm),
        name: feedName.trim(),
        url: urlNorm,
        items: [],
        status: 'ok',
        newCount: 0,
        expanded: false,
        showOnDashboard: false
      };
      onUpdateFeeds([...feeds, newFeed]);
    }

    setFeedName('');
    setFeedUrl('');
  };

  const handleEdit = (feed: Feed) => {
    setFeedName(feed.name);
    setFeedUrl(feed.url);
  };

  const handleDelete = (feedId: string) => {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;
    
    if (!confirm(`Remove feed: ${feed.name}?`)) return;
    
    const updatedFeeds = feeds.filter(f => f.id !== feedId);
    onUpdateFeeds(updatedFeeds);
  };

  const handleExport = () => {
    const data = {
      feeds: feeds.map(({ id, name, url, showOnDashboard }) => ({
        id,
        name,
        url,
        showOnDashboard: showOnDashboard !== false
      })),
      interval: settings.refreshInterval,
      theme: settings.theme,
      notifs: settings.notifications ? 'on' : 'off',
      sound: settings.sound ? 'on' : 'off',
      cardsPerRow: settings.cardsPerRow
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'naija-rss-settings.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (Array.isArray(data.feeds)) {
        const importedFeeds = data.feeds.map(
          (f: { id?: string; name: string; url: string; showOnDashboard?: boolean }) => ({
            id: typeof f.id === 'string' && f.id.length > 0 ? f.id : stableFeedId(f.url),
            name: f.name,
            url: f.url,
            items: [],
            status: 'ok',
            newCount: 0,
            expanded: false,
            showOnDashboard:
              typeof f.showOnDashboard === 'boolean' ? f.showOnDashboard : false
          })
        );
        onUpdateFeeds(importedFeeds);
      }

      const settingsUpdate: Partial<Settings> = {};
      if (typeof data.interval === 'number') {
        settingsUpdate.refreshInterval = data.interval;
      }
      if (data.theme) {
        settingsUpdate.theme = data.theme;
      }
      if (data.notifs) {
        settingsUpdate.notifications = data.notifs === 'on';
      }
      if (data.sound) {
        settingsUpdate.sound = data.sound === 'on';
      }
      if (typeof data.cardsPerRow === 'number') {
        settingsUpdate.cardsPerRow = data.cardsPerRow;
      }
      
      onUpdateSettings(settingsUpdate);
      alert('Settings imported successfully.');
    } catch (err) {
      alert('Import failed: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Feed Management Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feed Management</h2>
        </div>

        {/* Add/Edit Feed Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Newspaper name"
            value={feedName}
            onChange={(e) => setFeedName(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
          <input
            type="url"
            placeholder="RSS URL (https://...)"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add / Update
          </button>
        </form>

        {/* Feeds List */}
        <div className="space-y-3">
          {feeds.map((feed) => (
            <div key={feed.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{feed.name}</h3>
                <a
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {feed.url}
                </a>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${feed.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {feed.status === 'ok' ? 'Connected' : 'Inactive'}
                  </span>
                  <span>{feed.items?.length || 0} items</span>
                  {feed.newCount > 0 && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                      {feed.newCount} new
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(feed)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                  title="Edit feed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(feed.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete feed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Preferences</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auto Refresh
            </label>
            <select
              value={settings.refreshInterval}
              onChange={(e) => onUpdateSettings({ refreshInterval: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="300000">Every 5 minutes</option>
              <option value="600000">Every 10 minutes</option>
              <option value="900000">Every 15 minutes</option>
              <option value="0">Never</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => onUpdateSettings({ theme: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notifications
            </label>
            <select
              value={settings.notifications ? 'on' : 'off'}
              onChange={(e) => onUpdateSettings({ notifications: e.target.value === 'on' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sound
            </label>
            <select
              value={settings.sound ? 'on' : 'off'}
              onChange={(e) => onUpdateSettings({ sound: e.target.value === 'on' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cards Per Row
            </label>
            <select
              value={settings.cardsPerRow}
              onChange={(e) => onUpdateSettings({ cardsPerRow: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="1">1 card</option>
              <option value="2">2 cards</option>
              <option value="3">3 cards</option>
              <option value="4">4 cards</option>
              <option value="5">5 cards</option>
              <option value="6">6 cards</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data Management Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Data Management</h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Settings
          </button>
          
          <label className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import Settings
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <button
            onClick={onResetDefaults}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsTab;