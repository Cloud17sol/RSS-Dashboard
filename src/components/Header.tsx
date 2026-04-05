import React from 'react';
import { Settings, Bell, History, RotateCcw, Sun, Moon, Maximize2, Minimize2 } from 'lucide-react';

interface HeaderProps {
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
  onRefreshNow: () => void;
  countdown: string;
  theme: string;
  onThemeToggle: () => void;
  notifications: boolean;
  onNotificationToggle: () => void;
  sound: boolean;
  onSoundToggle: (enabled: boolean) => void;
  onHistoryToggle: () => void;
  onSettingsToggle: () => void;
  allExpanded: boolean;
  onToggleAllExpanded: () => void;
}

const Header: React.FC<HeaderProps> = ({
  refreshInterval,
  onRefreshIntervalChange,
  onRefreshNow,
  countdown,
  theme,
  onThemeToggle,
  notifications,
  onNotificationToggle,
  sound,
  onSoundToggle,
  onHistoryToggle,
  onSettingsToggle,
  allExpanded,
  onToggleAllExpanded,
}) => {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2" role="banner" aria-label="RSS Dashboard Header">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl" aria-hidden="true">📰</span>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">CCI - News Dashboard</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap">
          <select
            id="refreshInterval"
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
            className="px-1.5 sm:px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            aria-label="Refresh interval"
          >
            <option value="300000">5 min</option>
            <option value="600000">10 min</option>
            <option value="900000">15 min</option>
            <option value="0">Manual</option>
          </select>

          <button
            onClick={onRefreshNow}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-200"
            aria-label="Refresh now"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 min-w-[60px]" aria-live="polite">
            {countdown.replace('Next in ', '')}
          </span>

          <button
            onClick={onToggleAllExpanded}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-200"
            aria-label={allExpanded ? 'Collapse all cards' : 'Expand all cards'}
            title={allExpanded ? 'Collapse all cards' : 'Expand all cards'}
          >
            {allExpanded ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={onThemeToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-200"
            aria-pressed={isDark}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={onNotificationToggle}
            className={`p-2 rounded transition-colors ${notifications ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            aria-pressed={notifications}
            aria-label="Toggle notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <label className="hidden sm:flex items-center gap-1 cursor-pointer" aria-label="Sound notification">
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => onSoundToggle(e.target.checked)}
              className="w-3 h-3 accent-orange-500"
            />
            <span className="text-xs">🔊</span>
          </label>

          <button
            onClick={onHistoryToggle}
            className="hidden sm:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-200"
            aria-label="Show history"
          >
            <History className="w-5 h-5" />
          </button>

          <button
            onClick={onSettingsToggle}
            className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;