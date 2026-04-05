// ======= Utilities =======
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const STORAGE_KEYS = {
  SETTINGS: 'naija_rss_settings_v1',
  THEME: 'naija_rss_theme_v1',
  INTERVAL: 'naija_rss_interval_v1',
  NOTIFS: 'naija_rss_notifs_v1',
  SOUND: 'naija_rss_sound_v1',
  SEEN: 'naija_rss_seen_map_v1'
};

const DEFAULT_INTERVAL = 300000; // 5 minutes
const MAX_VISIBLE = 10;

function fmtTime(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth()+1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function safeURL(u) { try { return new URL(u).toString(); } catch { return null; } }

// ======= State =======
let state = {
  feeds: [],             // [{id, name, url, items:[], lastRefresh, status:'ok'|'err', newCount:0}]
  interval: +localStorage.getItem(STORAGE_KEYS.INTERVAL) || DEFAULT_INTERVAL,
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'system',
  notifs: localStorage.getItem(STORAGE_KEYS.NOTIFS) === 'on' ? 'on' : 'off',
  sound: localStorage.getItem(STORAGE_KEYS.SOUND) === 'on' ? 'on' : 'off',
  seenMap: JSON.parse(localStorage.getItem(STORAGE_KEYS.SEEN) || '{}'), // {feedId: {linkHash: true}}
  countdown: 0,
  timerId: null,
  history: []
};

const grid = $('#grid');
const cardTpl = $('#cardTemplate');

// ======= Theme =======
function applyTheme(pref = state.theme) {
  const root = document.documentElement;
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let isDark = false;
  if (pref === 'dark') isDark = true;
  else if (pref === 'light') isDark = false;
  else isDark = sysDark;
  root.classList.toggle('dark', isDark);
  $('#themeToggle').textContent = isDark ? '☀️ Light' : '🌙 Dark';
  $('#themeToggle').setAttribute('aria-pressed', String(isDark));
}

$('#themeToggle').addEventListener('click', () => {
  const now = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next = now === 'dark' ? 'light' : 'dark';
  state.theme = next;
  localStorage.setItem(STORAGE_KEYS.THEME, next);
  applyTheme(next);
});

// ======= Notifications =======
async function ensureNotifPermission() {
  if (state.notifs !== 'on') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

function notify(title, body) {
  if (state.notifs !== 'on' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: undefined });
  if (state.sound === 'on') {
    $('#beep').currentTime = 0;
    $('#beep').play().catch(() => {});
  }
  addHistory(`${title} — ${body}`);
}

$('#notifToggle').addEventListener('click', async () => {
  state.notifs = state.notifs === 'on' ? 'off' : 'on';
  localStorage.setItem(STORAGE_KEYS.NOTIFS, state.notifs);
  $('#notifToggle').textContent = state.notifs === 'on' ? '🔔 On' : '🔔 Off';
  $('#notifToggle').setAttribute('aria-pressed', String(state.notifs === 'on'));
  if (state.notifs === 'on') await ensureNotifPermission();
});

$('#soundToggle').checked = state.sound === 'on';
$('#soundToggle').addEventListener('change', e => {
  state.sound = e.target.checked ? 'on' : 'off';
  localStorage.setItem(STORAGE_KEYS.SOUND, state.sound);
});

// History panel
$('#historyToggle').addEventListener('click', () => {
  const panel = $('#historyPanel');
  const expanded = !panel.hasAttribute('hidden');
  if (expanded) {
    panel.hidden = true;
    $('#historyToggle').setAttribute('aria-expanded', 'false');
  } else {
    panel.hidden = false;
    $('#historyToggle').setAttribute('aria-expanded', 'true');
  }
});
$('#closeHistory').addEventListener('click', () => $('#historyPanel').hidden = true);

function addHistory(text) {
  state.history.unshift({ text, at: new Date() });
  const li = document.createElement('li');
  li.className = 'history-item';
  li.textContent = `[${fmtTime(new Date())}] ${text}`;
  $('#historyList').prepend(li);
}

// ======= Fetch RSS with CORS handling =======
async function fetchFeed(url) {
  const rssUrl = safeURL(url);
  if (!rssUrl) throw new Error('Invalid URL');

  // Strategy 1: rss2json (no key needed for basic usage)
  try {
    const r2j = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(r2j, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.items && Array.isArray(data.items)) {
        return data.items.map(i => ({
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
    // Atom?
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
}

// ======= Render =======
function hashLink(link) {
  const s = link || '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return String(h);
}

function renderGrid() {
  grid.innerHTML = '';
  state.feeds.forEach(feed => {
    const node = cardTpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = feed.id;

    $('.paper-name', node).textContent = feed.name;
    const statusDot = $('.status-dot', node);
    statusDot.classList.toggle('ok', feed.status === 'ok');
    statusDot.classList.toggle('err', feed.status === 'err');

    $('.refresh-time', node).textContent = feed.lastRefresh ? `Refreshed: ${fmtTime(feed.lastRefresh)}` : 'Not refreshed yet';
    $('.count', node).textContent = `${feed.items?.length || 0} items`;

    const badge = $('.badge', node);
    badge.textContent = String(feed.newCount || 0);
    badge.style.display = (feed.newCount || 0) > 0 ? 'inline-flex' : 'none';

    const progress = $('.progress', node);
    progress.style.opacity = feed.loading ? '1' : '0';
    progress.style.width = feed.loading ? '90%' : '0%';

    const list = $('.feed-list', node);
    const limit = feed.expanded ? Math.min(feed.items.length, 50) : Math.min(feed.items.length, MAX_VISIBLE);
    list.innerHTML = '';
    feed.items.slice(0, limit).forEach(item => {
      const li = document.createElement('li');
      li.className = 'feed-item';

      const title = document.createElement('p');
      title.className = 'feed-title';
      title.textContent = item.title;

      const meta = document.createElement('div');
      meta.className = 'feed-meta';
      const d = item.pubDate ? new Date(item.pubDate) : null;
      meta.textContent = d ? fmtTime(d) : '—';

      const actions = document.createElement('div');
      actions.className = 'feed-actions';

      const a = document.createElement('a');
      a.href = item.link || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'btn';
      a.textContent = 'Open';

      const more = document.createElement('button');
      more.className = 'btn';
      more.textContent = 'Expand';
      more.addEventListener('click', () => {
        const expanded = !!li.dataset.expanded;
        if (!expanded) {
          const full = document.createElement('div');
          full.className = 'feed-full';
          full.style.marginTop = '6px';
          full.style.whiteSpace = 'pre-wrap';
          full.style.lineHeight = '1.35';
          // Strip HTML tags from content for safety:
          const tmp = document.createElement('div');
          tmp.innerHTML = item.content || '';
          full.textContent = tmp.textContent?.trim() || '(no content)';
          li.appendChild(full);
          li.dataset.expanded = '1';
          more.textContent = 'Collapse';
        } else {
          const full = li.querySelector('.feed-full');
          if (full) full.remove();
          delete li.dataset.expanded;
          more.textContent = 'Expand';
        }
      });

      actions.append(a, more);
      li.append(title, meta, actions);
      list.appendChild(li);
    });

    const btnExpand = $('.btn-expand', node);
    btnExpand.textContent = feed.expanded ? 'Show 10' : 'Show more';
    btnExpand.setAttribute('aria-expanded', String(!!feed.expanded));
    btnExpand.addEventListener('click', () => {
      feed.expanded = !feed.expanded;
      renderGrid();
    });

    const btnMore = $('.btn-more', node);
    btnMore.addEventListener('click', () => {
      const url = prompt('View another RSS feed by URL (https://...)');
      if (url) previewExternalFeed(url);
    });

    grid.appendChild(node);
  });
}

async function previewExternalFeed(url) {
  try {
    const items = await fetchFeed(url);
    alert(`Fetched ${items.length} items from:\n${url}\n\n(Use Settings → Add feed to save it.)`);
  } catch (e) {
    alert(`Failed to fetch:\n${url}\n\n${e.message}`);
  }
}

// ======= Refresh Logic =======
async function refreshFeed(feed) {
  feed.loading = true; renderGrid();
  try {
    const items = await fetchFeed(feed.url);
    // Record new items
    const seen = state.seenMap[feed.id] || {};
    let newCount = 0;
    items.forEach(it => {
      const h = hashLink(it.link || it.title);
      if (!seen[h]) {
        newCount++;
        seen[h] = true;
      }
    });
    state.seenMap[feed.id] = seen;
    localStorage.setItem(STORAGE_KEYS.SEEN, JSON.stringify(state.seenMap));

    feed.items = items;
    feed.newCount = newCount;
    feed.lastRefresh = new Date();
    feed.status = 'ok';

    if (newCount > 0) {
      notify(`${feed.name}`, `${newCount} new headline${newCount>1?'s':''}`);
    }
  } catch (err) {
    feed.status = 'err';
  } finally {
    feed.loading = false;
    renderGrid();
  }
}

async function refreshAll() {
  await Promise.all(state.feeds.map(refreshFeed));
}

function startTimer() {
  clearInterval(state.timerId);
  if (!state.interval || state.interval <= 0) {
    $('#countdown').textContent = 'Auto refresh: Off';
    return;
  }
  state.countdown = state.interval;
  const tick = () => {
    state.countdown -= 1000;
    if (state.countdown <= 0) {
      state.countdown = state.interval;
      refreshAll();
    }
    const secs = Math.max(0, Math.floor(state.countdown / 1000));
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    $('#countdown').textContent = `Next in ${mm}:${ss}`;
  };
  tick();
  state.timerId = setInterval(tick, 1000);
}

// Controls
const refreshSel = $('#refreshInterval');
refreshSel.value = String(state.interval);
refreshSel.addEventListener('change', e => {
  state.interval = +e.target.value;
  localStorage.setItem(STORAGE_KEYS.INTERVAL, String(state.interval));
  startTimer();
});

$('#refreshNow').addEventListener('click', () => refreshAll());

// ======= Settings Panel =======
const settingsDlg = $('#settingsPanel');
$('#settingsToggle').addEventListener('click', () => {
  settingsDlg.showModal();
  // sync current prefs
  $('#settingsInterval').value = String(state.interval);
  $('#settingsTheme').value = state.theme || 'system';
  $('#settingsNotif').value = state.notifs;
  $('#settingsSound').value = state.sound;
  renderFeedsList();
});
$('#closeSettings').addEventListener('click', () => settingsDlg.close());

$('#settingsInterval').addEventListener('change', e => {
  const v = +e.target.value;
  state.interval = v;
  localStorage.setItem(STORAGE_KEYS.INTERVAL, String(v));
  refreshSel.value = String(v);
  startTimer();
});
$('#settingsTheme').addEventListener('change', e => {
  const v = e.target.value;
  state.theme = v;
  localStorage.setItem(STORAGE_KEYS.THEME, v);
  applyTheme(v);
});
$('#settingsNotif').addEventListener('change', async e => {
  const v = e.target.value;
  state.notifs = v;
  localStorage.setItem(STORAGE_KEYS.NOTIFS, v);
  $('#notifToggle').textContent = v === 'on' ? '🔔 On' : '🔔 Off';
  if (v === 'on') await ensureNotifPermission();
});
$('#settingsSound').addEventListener('change', e => {
  const v = e.target.value;
  state.sound = v;
  localStorage.setItem(STORAGE_KEYS.SOUND, v);
  $('#soundToggle').checked = v === 'on';
});

// Manage feeds list
function saveFeeds(feeds) {
  const settings = { feeds };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function getSavedFeeds() {
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) return null;
  try { return JSON.parse(raw).feeds || null; } catch { return null; }
}

function renderFeedsList() {
  const ul = $('#feedsList'); ul.innerHTML = '';
  state.feeds.forEach(f => {
    const li = document.createElement('li');
    const name = document.createElement('span'); name.textContent = f.name;
    const url = document.createElement('a'); url.href = f.url; url.textContent = f.url; url.target = '_blank'; url.rel = 'noopener';
    const edit = document.createElement('button'); edit.className = 'btn'; edit.textContent = 'Edit';
    const del = document.createElement('button'); del.className = 'btn danger'; del.textContent = 'Delete';

    edit.addEventListener('click', () => {
      $('#feedName').value = f.name;
      $('#feedUrl').value = f.url;
      $('#feedName').focus();
    });
    del.addEventListener('click', () => {
      if (!confirm(`Remove feed: ${f.name}?`)) return;
      state.feeds = state.feeds.filter(x => x.id !== f.id);
      saveFeeds(state.feeds.map(({name,url}) => ({name,url})));
      renderFeedsList();
      renderGrid();
    });

    li.append(name, url, edit, del);
    ul.appendChild(li);
  });
}

$('#feedForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#feedName').value.trim();
  const url = $('#feedUrl').value.trim();
  if (!name || !safeURL(url)) { alert('Please provide a valid name and URL'); return; }

  const exists = state.feeds.find(f => f.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    exists.name = name; exists.url = url; exists.items = []; exists.newCount = 0;
  } else {
    state.feeds.push({ id: crypto.randomUUID(), name, url, items: [], status: 'ok', newCount: 0, expanded: false });
  }
  saveFeeds(state.feeds.map(({name,url}) => ({name,url})));
  $('#feedName').value = ''; $('#feedUrl').value = '';
  renderFeedsList(); renderGrid(); refreshAll();
});

$('#exportBtn').addEventListener('click', () => {
  const data = {
    feeds: state.feeds.map(({name,url}) => ({name,url})),
    interval: state.interval,
    theme: state.theme,
    notifs: state.notifs,
    sound: state.sound
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'naija-rss-settings.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#importFile').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data.feeds)) {
      state.feeds = data.feeds.map(f => ({ id: crypto.randomUUID(), name: f.name, url: f.url, items: [], status: 'ok', newCount: 0 }));
      saveFeeds(state.feeds.map(({name,url}) => ({name,url})));
    }
    if (typeof data.interval === 'number') {
      state.interval = data.interval;
      localStorage.setItem(STORAGE_KEYS.INTERVAL, String(state.interval));
      refreshSel.value = String(state.interval);
    }
    if (data.theme) { state.theme = data.theme; localStorage.setItem(STORAGE_KEYS.THEME, data.theme); applyTheme(data.theme); }
    if (data.notifs) { state.notifs = data.notifs; localStorage.setItem(STORAGE_KEYS.NOTIFS, data.notifs); }
    if (data.sound) { state.sound = data.sound; localStorage.setItem(STORAGE_KEYS.SOUND, data.sound); }
    renderFeedsList(); renderGrid(); refreshAll(); startTimer();
    alert('Settings imported.');
  } catch (err) {
    alert('Import failed: ' + err.message);
  } finally {
    e.target.value = '';
  }
});

$('#resetDefaults').addEventListener('click', async () => {
  if (!confirm('Reset feeds and preferences to defaults?')) return;
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  await bootstrap();
});

// ======= Bootstrap =======
async function bootstrap() {
  applyTheme(state.theme);
  $('#notifToggle').textContent = state.notifs === 'on' ? '🔔 On' : '🔔 Off';
  $('#notifToggle').setAttribute('aria-pressed', String(state.notifs === 'on'));

  // Load feeds: from saved settings or config.json
  const saved = getSavedFeeds();
  if (saved && saved.length) {
    state.feeds = saved.map(f => ({ id: crypto.randomUUID(), name: f.name, url: f.url, items: [], status: 'ok', newCount: 0, expanded: false }));
  } else {
    // fetch config.json
    try {
      const res = await fetch('./config.json', { cache: 'no-store' });
      const data = await res.json();
      state.feeds = (data.feeds || []).map(f => ({ id: crypto.randomUUID(), name: f.name, url: f.url, items: [], status: 'ok', newCount: 0, expanded: false }));
      saveFeeds(state.feeds.map(({name,url}) => ({name,url})));
    } catch {
      state.feeds = [];
    }
  }

  renderGrid();
  await refreshAll();
  startTimer();
}

bootstrap();
