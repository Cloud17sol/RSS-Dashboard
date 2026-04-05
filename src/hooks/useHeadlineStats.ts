import { useState, useEffect, useCallback } from 'react';
import { nigeriaStates } from '../data/nigeriaStates';

export interface StateHeadlineStats {
  stateName: string;
  region: string;
  capital: string;
  count: number;
  headlines: string[];
}

export interface RegionStats {
  region: string;
  count: number;
  statesAffected: number;
}

export interface DashboardStats {
  totalHeadlines: number;
  statesWithNews: number;
  topStates: StateHeadlineStats[];
  topRegions: RegionStats[];
  stateStats: Record<string, StateHeadlineStats>;
  lastUpdated: Date;
}

const stateKeywords: Record<string, string[]> = {};

nigeriaStates.forEach(state => {
  stateKeywords[state.name] = [
    state.name.toLowerCase(),
    state.capital.toLowerCase(),
    ...state.majorTowns.map(t => t.toLowerCase())
  ];
});

const detectStatesInText = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  const detectedStates: Set<string> = new Set();

  for (const [stateName, keywords] of Object.entries(stateKeywords)) {
    for (const keyword of keywords) {
      if (keyword.length > 2 && lowerText.includes(keyword)) {
        detectedStates.add(stateName);
        break;
      }
    }
  }

  return Array.from(detectedStates);
};

export const useHeadlineStats = (feeds: any[] = []) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalHeadlines: 0,
    statesWithNews: 0,
    topStates: [],
    topRegions: [],
    stateStats: {},
    lastUpdated: new Date()
  });
  const [loading, setLoading] = useState(false);

  const calculateStats = useCallback(() => {
    setLoading(true);

    const stateStats: Record<string, StateHeadlineStats> = {};
    const regionStats: Record<string, { count: number; states: Set<string> }> = {};

    nigeriaStates.forEach(state => {
      stateStats[state.name] = {
        stateName: state.name,
        region: state.region,
        capital: state.capital,
        count: 0,
        headlines: []
      };

      if (!regionStats[state.region]) {
        regionStats[state.region] = { count: 0, states: new Set() };
      }
    });

    let totalHeadlines = 0;

    feeds.forEach(feed => {
      if (feed.items) {
        feed.items.forEach((item: any) => {
          totalHeadlines++;
          const headlineText = `${item.title} ${item.content || ''}`;
          const detectedStates = detectStatesInText(headlineText);

          detectedStates.forEach(stateName => {
            if (stateStats[stateName]) {
              stateStats[stateName].count++;
              stateStats[stateName].headlines.push(item.title);
              regionStats[stateStats[stateName].region].count++;
              regionStats[stateStats[stateName].region].states.add(stateName);
            }
          });
        });
      }
    });

    const topStates = Object.values(stateStats)
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topRegions: RegionStats[] = Object.entries(regionStats)
      .map(([region, data]) => ({
        region,
        count: data.count,
        statesAffected: data.states.size
      }))
      .sort((a, b) => b.count - a.count);

    setStats({
      totalHeadlines,
      statesWithNews: Object.values(stateStats).filter(s => s.count > 0).length,
      topStates,
      topRegions,
      stateStats,
      lastUpdated: new Date()
    });

    setLoading(false);
  }, [feeds]);

  useEffect(() => {
    if (feeds.length > 0) {
      calculateStats();
    }
  }, [feeds, calculateStats]);

  return { stats, loading, refetch: calculateStats };
};
