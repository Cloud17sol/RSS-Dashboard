import React, { useMemo } from 'react';
import { MapPin, Zap } from 'lucide-react';
import { nigeriaStates, State } from '../data/nigeriaStates';

interface NigeriaMapProps {
  onStateClick: (state: State) => void;
  selectedState: State | null;
  stateCounts?: Record<string, number>;
}

const stateCoordinates: Record<string, { x: number; y: number }> = {
  'Abia': { x: 75, y: 60 },
  'Adamawa': { x: 70, y: 15 },
  'Akwa Ibom': { x: 80, y: 70 },
  'Anambra': { x: 68, y: 52 },
  'Bauchi': { x: 55, y: 25 },
  'Bayelsa': { x: 65, y: 75 },
  'Benue': { x: 60, y: 45 },
  'Borno': { x: 75, y: 10 },
  'Cross River': { x: 82, y: 65 },
  'Delta': { x: 62, y: 68 },
  'Ebonyi': { x: 72, y: 55 },
  'Edo': { x: 58, y: 62 },
  'Ekiti': { x: 48, y: 62 },
  'Enugu': { x: 70, y: 52 },
  'Gombe': { x: 62, y: 20 },
  'Imo': { x: 72, y: 60 },
  'Jigawa': { x: 40, y: 18 },
  'Kaduna': { x: 48, y: 30 },
  'Kano': { x: 38, y: 15 },
  'Katsina': { x: 35, y: 12 },
  'Kebbi': { x: 28, y: 20 },
  'Kogi': { x: 58, y: 48 },
  'Kwara': { x: 48, y: 50 },
  'Lagos': { x: 42, y: 75 },
  'Nasarawa': { x: 58, y: 40 },
  'Niger': { x: 50, y: 38 },
  'Ogun': { x: 45, y: 70 },
  'Ondo': { x: 52, y: 68 },
  'Osun': { x: 48, y: 65 },
  'Oyo': { x: 45, y: 60 },
  'Plateau': { x: 55, y: 35 },
  'Rivers': { x: 68, y: 75 },
  'Sokoto': { x: 25, y: 18 },
  'Taraba': { x: 65, y: 30 },
  'Yobe': { x: 58, y: 12 },
  'Zamfara': { x: 32, y: 20 },
  'FCT': { x: 52, y: 42 }
};

const NigeriaMap: React.FC<NigeriaMapProps> = ({
  onStateClick,
  selectedState,
  stateCounts = {}
}) => {
  const getCountColor = (count: number): string => {
    if (count === 0) return '#e5e7eb';
    if (count < 5) return '#4ade80';
    if (count < 15) return '#0ea5e9';
    if (count < 30) return '#f97316';
    return '#dc2626';
  };

  const getRadius = (count: number): number => {
    if (count === 0) return 3.5;
    return Math.min(3.5 + (count / 10), 8);
  };

  const stateNodes = useMemo(() => {
    return nigeriaStates.map(state => {
      const coords = stateCoordinates[state.name];
      const count = stateCounts[state.name] || 0;
      const isSelected = selectedState?.name === state.name;

      if (!coords) return null;

      return (
        <g key={state.name}>
          <circle
            cx={coords.x}
            cy={coords.y}
            r={getRadius(count)}
            fill={isSelected ? '#f97316' : getCountColor(count)}
            opacity={isSelected ? 1 : 0.8}
            className="cursor-pointer hover:opacity-100 transition-all duration-200"
            onClick={() => onStateClick(state)}
            style={{
              filter: isSelected ? 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))' : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
            }}
          />
          {count > 0 && (
            <text
              x={coords.x}
              y={coords.y - (getRadius(count) + 3)}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#1f2937"
              className="pointer-events-none font-semibold"
            >
              {count}
            </text>
          )}
          <title className="pointer-events-none">
            {state.name}: {state.capital} ({count} headlines)
          </title>
        </g>
      );
    }).filter(Boolean);
  }, [selectedState, stateCounts]);

  const totalHeadlines = Object.values(stateCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          Nigeria State Map
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click on any state to view details. Bubble size indicates news headline frequency.
        </p>
      </div>

      <svg
        viewBox="0 0 100 85"
        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-700"
      >
        <defs>
          <filter id="mapShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.2" />
          </filter>
        </defs>

        <text x="50" y="4" textAnchor="middle" fontSize="8" fill="#9ca3af" className="dark:fill-gray-400">
          Map of Nigerian States
        </text>

        <g filter="url(#mapShadow)">
          {stateNodes}
        </g>

        <text
          x="50"
          y="82"
          textAnchor="middle"
          fontSize="7"
          fill="#9ca3af"
          className="dark:fill-gray-400"
        >
          Click states for details • {totalHeadlines} total headlines
        </text>
      </svg>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e5e7eb' }}></div>
          <span className="text-gray-600 dark:text-gray-400">None</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4ade80' }}></div>
          <span className="text-gray-600 dark:text-gray-400">1-4</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0ea5e9' }}></div>
          <span className="text-gray-600 dark:text-gray-400">5-14</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
          <span className="text-gray-600 dark:text-gray-400">15-29</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
          <span className="text-gray-600 dark:text-gray-400">30+</span>
        </div>
      </div>

      {selectedState && (
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="font-semibold text-orange-900 dark:text-orange-100">{selectedState.name} State</p>
              <p className="text-sm text-orange-800 dark:text-orange-200">{selectedState.capital} • {selectedState.region}</p>
            </div>
            {(stateCounts[selectedState.name] || 0) > 0 && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-2 py-1 rounded">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-orange-600 dark:text-orange-300">{stateCounts[selectedState.name]}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NigeriaMap;
