import { useState, useEffect, useCallback, useRef } from 'react';
import { stableFeedId } from '../lib/feedId';

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

interface HistoryItem {
  text: string;
  at: Date;
}

interface SavedFeedRow {
  id?: string;
  name: string;
  url: string;
}

const idForSavedRow = (f: SavedFeedRow): string =>
  typeof f.id === 'string' && f.id.length > 0 ? f.id : stableFeedId(f.url);

const pruneSeenForFeedIds = (
  feedIds: Set<string>,
  raw: Record<string, Record<string, boolean>>
) => {
  const next: Record<string, Record<string, boolean>> = {};
  for (const id of feedIds) {
    if (raw[id]) next[id] = raw[id];
  }
  return next;
};

const STORAGE_KEYS = {
  SETTINGS: 'naija_rss_settings_v1',
  THEME: 'naija_rss_theme_v1',
  INTERVAL: 'naija_rss_interval_v1',
  NOTIFS: 'naija_rss_notifs_v1',
  SOUND: 'naija_rss_sound_v1',
  SEEN: 'naija_rss_seen_map_v1',
  CARDS_PER_ROW: 'naija_rss_cards_per_row_v1'
};

const DEFAULT_FEEDS = [
  { name: "The Guardian Nigeria", url: "https://guardian.ng/feed/" },
  { name: "Vanguard", url: "https://www.vanguardngr.com/feed/" },
  { name: "ThisDay Live", url: "https://www.thisdaylive.com/index.php/feed/" },
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/rss.xml" },
  { name: "Daily Trust", url: "https://dailytrust.com/feed" },
  { name: "The Nation", url: "https://thenationonlineng.net/feed/" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "BBC News Africa", url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml" },
  { name: "Pulse Nigeria - General", url: "https://www.pulse.ng/news/rss" },
  { name: "Channels News", url: "https://www.channelstv.com/feed" },
  { name: "P.M. News", url: "https://pmnewsnigeria.com/feed" },
  { name: "Premium Times", url: "https://www.premiumtimesng.com/feed" },
  { name: "BBC News Hausa", url: "https://www.bbc.com/hausa/index.xml" }
];

const useRSSFeeds = () => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [refreshInterval, setRefreshIntervalState] = useState(() => 
    +localStorage.getItem(STORAGE_KEYS.INTERVAL)! || 300000
  );
  const [theme, setThemeState] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.THEME) || 'system'
  );
  const [notifications, setNotificationsState] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.NOTIFS) === 'on'
  );
  const [sound, setSoundState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.SOUND) === 'on'
  );
  const [cardsPerRow, setCardsPerRowState] = useState(() =>
    +localStorage.getItem(STORAGE_KEYS.CARDS_PER_ROW)! || 4
  );
  const [countdown, setCountdown] = useState('Next in —');
  const [seenMap, setSeenMap] = useState(() =>
    JSON.parse(localStorage.getItem(STORAGE_KEYS.SEEN) || '{}')
  );
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Safe URL validation
  const safeURL = (url: string) => {
    try {
      return new URL(url).toString();
    } catch {
      return null;
    }
  };

  // Hash function for tracking seen items
  const hashLink = (link: string) => {
    const s = link || '';
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i) | 0;
    }
    return String(h);
  };

  // Fetch RSS feed with CORS handling
  const fetchFeed = async (url: string): Promise<FeedItem[]> => {
    const rssUrl = safeURL(url);
    if (!rssUrl) throw new Error('Invalid URL');

    // Strategy 1: rss2json
    try {
      const r2j = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      const res = await fetch(r2j, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && Array.isArray(data.items)) {
          return data.items.map((i: any) => ({
            title: i.title || '(no title)',
            link: i.link || rssUrl,
            pubDate: i.pubDate || i.pub_date || i.pubdate || null,
            content: i.content || i.description || ''
          }));
        }
      }
    } catch (_) {}

    // Strategy 2: allorigins + parse XML
    const ao = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(ao, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('XML parse error');

    const items = [...xml.querySelectorAll('item')];
    if (items.length === 0) {
      // Try Atom format
      const entries = [...xml.querySelectorAll('entry')];
      return entries.map(e => ({
        title: e.querySelector('title')?.textContent?.trim() || '(no title)',
        link: e.querySelector('link')?.getAttribute('href') || rssUrl,
        pubDate: e.querySelector('updated')?.textContent || e.querySelector('published')?.textContent || null,
        content: e.querySelector('content')?.textContent || e.querySelector('summary')?.textContent || ''
      }));
    }

    return items.map(it => ({
      title: it.querySelector('title')?.textContent?.trim() || '(no title)',
      link: it.querySelector('link')?.textContent?.trim() || it.querySelector('guid')?.textContent || rssUrl,
      pubDate: it.querySelector('pubDate')?.textContent || it.querySelector('dc\\:date')?.textContent || null,
      content: it.querySelector('description')?.textContent || ''
    }));
  };

  // Notification handling
  const ensureNotificationPermission = async () => {
    if (!notifications) return false;
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const notify = (title: string, body: string) => {
    if (!notifications || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    new Notification(title, { body });
    
    if (sound) {
      // Create audio element for notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+rywm8dBDb12w==');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }

    const historyItem: HistoryItem = {
      text: `${title} — ${body}`,
      at: new Date()
    };
    setHistory(prev => [historyItem, ...prev].slice(0, 50));
  };

  // Refresh single feed
  const refreshFeed = async (feed: Feed, isInitialLoad: boolean = false) => {
    setFeeds(prev => prev.map(f =>
      f.id === feed.id ? { ...f, loading: true } : f
    ));

    try {
      const items = await fetchFeed(feed.url);

      // Track new items
      const seen = seenMap[feed.id] || {};
      const isFirstFetch = Object.keys(seen).length === 0;
      let newCount = 0;

      items.forEach(item => {
        const hash = hashLink(item.link || item.title);
        if (!seen[hash]) {
          newCount++;
          seen[hash] = true;
        }
      });

      const newSeenMap = { ...seenMap, [feed.id]: seen };
      setSeenMap(newSeenMap);
      localStorage.setItem(STORAGE_KEYS.SEEN, JSON.stringify(newSeenMap));

      setFeeds(prev => prev.map(f =>
        f.id === feed.id ? {
          ...f,
          items,
          newCount: isFirstFetch ? 0 : newCount,
          lastRefresh: new Date(),
          status: 'ok' as const,
          loading: false
        } : f
      ));

      // Only notify for new items after initial load
      if (newCount > 0 && !isFirstFetch && !isInitialLoad) {
        notify(feed.name, `${newCount} new headline${newCount > 1 ? 's' : ''}`);
      } else if (isFirstFetch && items.length > 0 && !isInitialLoad) {
        // For first time loading a feed (not initial app load), add to history
        const historyItem: HistoryItem = {
          text: `${feed.name} — Loaded ${items.length} headline${items.length > 1 ? 's' : ''}`,
          at: new Date()
        };
        setHistory(prev => [historyItem, ...prev].slice(0, 50));
      }
    } catch (error) {
      setFeeds(prev => prev.map(f =>
        f.id === feed.id ? { ...f, status: 'err' as const, loading: false } : f
      ));
    }
  };

  // Refresh all feeds
  const refreshAll = useCallback(async () => {
    await Promise.all(feeds.map(refreshFeed));
  }, [feeds, seenMap]);

  // Start countdown timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!refreshInterval || refreshInterval <= 0) {
      setCountdown('Auto refresh: Off');
      return;
    }

    let countdownTime = refreshInterval;
    
    const updateCountdown = () => {
      countdownTime -= 1000;
      if (countdownTime <= 0) {
        countdownTime = refreshInterval;
        refreshAll();
      }
      const secs = Math.max(0, Math.floor(countdownTime / 1000));
      const mm = String(Math.floor(secs / 60)).padStart(2, '0');
      const ss = String(secs % 60).padStart(2, '0');
      setCountdown(`Next in ${mm}:${ss}`);
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);
  }, [refreshInterval, refreshAll]);

  // Theme management
  const applyTheme = useCallback((themePref: string = theme) => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDark = false;
    
    if (themePref === 'dark') isDark = true;
    else if (themePref === 'light') isDark = false;
    else isDark = systemDark;
    
    root.classList.toggle('dark', isDark);
  }, [theme]);

  // Save feeds to localStorage (ids stable across reloads)
  const saveFeeds = (feedsToSave: Feed[]) => {
    const settings = {
      feeds: feedsToSave.map(({ id, name, url }) => ({ id, name, url }))
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  };

  // Load feeds from localStorage
  const getSavedFeeds = (): SavedFeedRow[] | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return null;
    try {
      const feeds = JSON.parse(raw).feeds;
      return Array.isArray(feeds) ? feeds : null;
    } catch {
      return null;
    }
  };

  // Update functions
  const setRefreshInterval = (interval: number) => {
    setRefreshIntervalState(interval);
    localStorage.setItem(STORAGE_KEYS.INTERVAL, String(interval));
  };

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    applyTheme(newTheme);
  };

  const setNotifications = (enabled: boolean) => {
    setNotificationsState(enabled);
    localStorage.setItem(STORAGE_KEYS.NOTIFS, enabled ? 'on' : 'off');
    if (enabled) {
      ensureNotificationPermission();
    }
  };

  const setSound = (enabled: boolean) => {
    setSoundState(enabled);
    localStorage.setItem(STORAGE_KEYS.SOUND, enabled ? 'on' : 'off');
  };

  const setCardsPerRow = (value: number) => {
    setCardsPerRowState(value);
    localStorage.setItem(STORAGE_KEYS.CARDS_PER_ROW, String(value));
  };

  // Toggle feed expansion
  const toggleFeedExpansion = (feedId: string) => {
    setFeeds(prev => prev.map(feed => 
      feed.id === feedId ? { ...feed, expanded: !feed.expanded } : feed
    ));
  };

  // Update feeds
  const updateFeeds = (newFeeds: Feed[]) => {
    setFeeds(newFeeds);
    saveFeeds(newFeeds);
    setSeenMap(prev => {
      const ids = new Set(newFeeds.map(f => f.id));
      const next = pruneSeenForFeedIds(ids, prev);
      localStorage.setItem(STORAGE_KEYS.SEEN, JSON.stringify(next));
      return next;
    });
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    
    const defaultFeeds = DEFAULT_FEEDS.map(f => ({
      id: stableFeedId(f.url),
      name: f.name,
      url: f.url,
      items: [],
      status: 'ok' as const,
      newCount: 0,
      expanded: false
    }));
    
    setFeeds(defaultFeeds);
    setRefreshIntervalState(300000);
    setThemeState('system');
    setNotificationsState(false);
    setSoundState(false);
    setSeenMap({});
    setHistory([]);
    
    saveFeeds(defaultFeeds);
    applyTheme('system');
  };

  // Initialize
  useEffect(() => {
    const initializeFeeds = async () => {
      const saved = getSavedFeeds();
      
      let initialFeeds: Feed[];
      if (saved && saved.length) {
        initialFeeds = saved.map((f: SavedFeedRow) => ({
          id: idForSavedRow(f),
          name: f.name,
          url: f.url,
          items: [],
          status: 'ok' as const,
          newCount: 0,
          expanded: false
        }));
      } else {
        initialFeeds = DEFAULT_FEEDS.map(f => ({
          id: stableFeedId(f.url),
          name: f.name,
          url: f.url,
          items: [],
          status: 'ok' as const,
          newCount: 0,
          expanded: false
        }));
        saveFeeds(initialFeeds);
      }

      setSeenMap(prev => {
        const ids = new Set(initialFeeds.map(f => f.id));
        const next = pruneSeenForFeedIds(ids, prev);
        localStorage.setItem(STORAGE_KEYS.SEEN, JSON.stringify(next));
        return next;
      });

      setFeeds(initialFeeds);
      applyTheme();

      // Initial refresh
      setTimeout(() => {
        Promise.all(initialFeeds.map(feed => refreshFeed(feed, true)));
      }, 100);
    };

    initializeFeeds();
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [startTimer]);

  return {
    feeds,
    refreshInterval,
    theme,
    notifications,
    sound,
    cardsPerRow,
    countdown,
    history,
    refreshAll,
    refreshFeed,
    setRefreshInterval,
    setTheme,
    setNotifications,
    setSound,
    setCardsPerRow,
    toggleFeedExpansion,
    updateFeeds,
    resetToDefaults,
    fetchFeed
  };
};

export default useRSSFeeds;