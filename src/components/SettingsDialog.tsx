import React, { useState, useEffect } from 'react';
import { X, Upload, Download, RotateCcw, Edit, Trash2 } from 'lucide-react';

interface Feed {
  id: string;
  name: string;
  url: string;
  items: any[];
  status: string;
  newCount: number;
  expanded?: boolean;
}

interface Settings {
  refreshInterval: number;
  theme: string;
  notifications: boolean;
  sound: boolean;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: Feed[];
  settings: Settings;
  onUpdateFeeds: (feeds: Feed[]) => void;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onResetDefaults: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
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

    if (existingFeedIndex >= 0) {
      // Update existing feed
      const updatedFeeds = [...feeds];
      updatedFeeds[existingFeedIndex] = {
        ...updatedFeeds[existingFeedIndex],
        name: feedName,
        url: feedUrl,
        items: [],
        newCount: 0
      };
      onUpdateFeeds(updatedFeeds);
    } else {
      // Add new feed
      const newFeed: Feed = {
        id: crypto.randomUUID(),
        name: feedName,
        url: feedUrl,
        items: [],
        status: 'ok',
        newCount: 0,
        expanded: false
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
      feeds: feeds.map(({ name, url }) => ({ name, url })),
      interval: settings.refreshInterval,
      theme: settings.theme,
      notifs: settings.notifications ? 'on' : 'off',
      sound: settings.sound ? 'on' : 'off'
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
        const importedFeeds = data.feeds.map((f: any) => ({
          id: crypto.randomUUID(),
          name: f.name,
          url: f.url,
          items: [],
          status: 'ok',
          newCount: 0,
          expanded: false
        }));
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
      
      onUpdateSettings(settingsUpdate);
      alert('Settings imported successfully.');
    } catch (err) {
      alert('Import failed: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <dialog open className="settings" aria-label="Settings Panel">
      <header className="settings-header">
        <h2>Settings</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close settings">
          <X className="w-4 h-4" />
        </button>
      </header>

      <section className="settings-section" aria-labelledby="feedsHeading">
        <h3 id="feedsHeading">Manage RSS Feeds</h3>
        <form onSubmit={handleSubmit} className="feed-form" autoComplete="off">
          <input
            type="text"
            placeholder="Newspaper name"
            value={feedName}
            onChange={(e) => setFeedName(e.target.value)}
            aria-label="Newspaper name"
            required
          />
          <input
            type="url"
            placeholder="RSS url (https://...)"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            aria-label="Feed URL"
            required
          />
          <button className="btn" type="submit">Add / Update</button>
        </form>
        
        <ul className="feeds-list" role="list" aria-live="polite">
          {feeds.map((feed) => (
            <li key={feed.id}>
              <span>{feed.name}</span>
              <a href={feed.url} target="_blank" rel="noopener noreferrer">
                {feed.url}
              </a>
              <button className="btn" onClick={() => handleEdit(feed)}>
                <Edit className="w-4 h-4 inline mr-1" />
                Edit
              </button>
              <button className="btn danger" onClick={() => handleDelete(feed.id)}>
                <Trash2 className="w-4 h-4 inline mr-1" />
                Delete
              </button>
            </li>
          ))}
        </ul>

        <div className="io-row">
          <button onClick={handleExport} className="btn">
            <Download className="w-4 h-4 inline mr-1" />
            Export Settings
          </button>
          <label className="btn filelabel">
            <Upload className="w-4 h-4 inline mr-1" />
            Import Settings
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              hidden
            />
          </label>
          <button onClick={onResetDefaults} className="btn danger">
            <RotateCcw className="w-4 h-4 inline mr-1" />
            Reset to Defaults
          </button>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="preferencesHeading">
        <h3 id="preferencesHeading">Preferences</h3>
        <div className="pref-grid">
          <label>
            Refresh:
            <select
              value={settings.refreshInterval}
              onChange={(e) => onUpdateSettings({ refreshInterval: Number(e.target.value) })}
            >
              <option value="300000">Every 5 minutes</option>
              <option value="600000">Every 10 minutes</option>
              <option value="900000">Every 15 minutes</option>
              <option value="0">Never</option>
            </select>
          </label>
          <label>
            Theme:
            <select
              value={settings.theme}
              onChange={(e) => onUpdateSettings({ theme: e.target.value })}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Notifications:
            <select
              value={settings.notifications ? 'on' : 'off'}
              onChange={(e) => onUpdateSettings({ notifications: e.target.value === 'on' })}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </label>
          <label>
            Sound:
            <select
              value={settings.sound ? 'on' : 'off'}
              onChange={(e) => onUpdateSettings({ sound: e.target.value === 'on' })}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </label>
        </div>
      </section>
    </dialog>
  );
};

export default SettingsDialog;