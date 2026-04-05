import React, { useState, useMemo } from 'react';
import { MapPin, X, Zap, TrendingUp, AlertCircle, BarChart3, Globe } from 'lucide-react';
import { nigeriaStates, State } from '../data/nigeriaStates';
import NigeriaMap from './NigeriaMap';
import { useHeadlineStats } from '../hooks/useHeadlineStats';

interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  content: string;
}

interface MapTabFeed {
  id: string;
  name: string;
  url: string;
  items: FeedItem[];
  status: 'ok' | 'err';
  newCount: number;
}

interface MapTabProps {
  feeds: MapTabFeed[];
}

const MapTab: React.FC<MapTabProps> = ({ feeds }) => {
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const { stats, loading } = useHeadlineStats(feeds);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(stats.stateStats).forEach(([stateName, data]) => {
      counts[stateName] = data.count;
    });
    return counts;
  }, [stats.stateStats]);

  const getRegionStats = (region: string) => {
    return stats.topRegions.find(r => r.region === region);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            News Coverage Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time headline distribution across Nigerian states
          </p>
        </div>
        {loading && (
          <div className="animate-pulse">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Headlines</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                {loading ? '-' : stats.totalHeadlines}
              </p>
            </div>
            <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">States with News</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {loading ? '-' : `${stats.statesWithNews}/37`}
              </p>
            </div>
            <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Top Region</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {loading ? '-' : stats.topRegions[0]?.count || 0}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1 truncate">
                {stats.topRegions[0]?.region || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-green-200 dark:bg-green-800 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Top State</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1 truncate">
                {loading ? '-' : stats.topStates[0]?.stateName || 'N/A'}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                {stats.topStates[0]?.count || 0} headlines
              </p>
            </div>
            <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-500" />
            Regional Distribution
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Headlines by region</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.topRegions.map(region => {
            const percentage = stats.totalHeadlines > 0 ? (region.count / stats.totalHeadlines * 100).toFixed(1) : '0';
            return (
              <div key={region.region} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{region.region}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{region.count}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{region.statesAffected} states • {percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Top States
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Most mentioned in today's headlines</p>
        </div>
        <div className="space-y-2">
          {stats.topStates.slice(0, 5).map((state, idx) => {
            const percentage = stats.totalHeadlines > 0 ? (state.count / stats.totalHeadlines * 100).toFixed(1) : '0';
            return (
              <div key={state.stateName} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" onClick={() => setSelectedState(nigeriaStates.find(s => s.name === state.stateName) || null)}>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{state.stateName}</p>
                  <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600 dark:text-orange-400">{state.count}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      <NigeriaMap
        onStateClick={setSelectedState}
        selectedState={selectedState}
        stateCounts={stateCounts}
      />

      {selectedState && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border-2 border-orange-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedState.name} State
              </h3>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                {selectedState.region}
              </span>
            </div>
            <button
              onClick={() => setSelectedState(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                State Capital
              </h4>
              <p className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                {selectedState.capital}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Major Towns ({selectedState.majorTowns.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedState.majorTowns.map(town => (
                  <span
                    key={town}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                  >
                    {town}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MapTab;
