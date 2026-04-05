import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { MapPin, Zap } from 'lucide-react';
import { nigeriaStates, State } from '../data/nigeriaStates';
import {
  NIGERIA_BOUNDS,
  NIGERIA_DEFAULT_ZOOM,
  NIGERIA_MAP_CENTER,
  stateMapLatLng
} from '../data/nigeriaStateMapCoords';
import 'leaflet/dist/leaflet.css';

interface NigeriaMapProps {
  onStateClick: (state: State) => void;
  selectedState: State | null;
  stateCounts?: Record<string, number>;
}

function useMapFollowsDarkMode() {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains('dark'));
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  return dark;
}

function MapThemeTiles({ dark }: { dark: boolean }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [dark, map]);

  if (dark) {
    return (
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
    );
  }

  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      subdomains="abcd"
      maxZoom={20}
    />
  );
}

const getCountColor = (count: number): string => {
  if (count === 0) return '#9ca3af';
  if (count < 5) return '#22c55e';
  if (count < 15) return '#0ea5e9';
  if (count < 30) return '#f97316';
  return '#dc2626';
};

const bubbleRadiusPx = (count: number, selected: boolean): number => {
  const base = count === 0 ? 6 : 7 + Math.sqrt(count) * 3.2;
  const capped = Math.min(base, 36);
  return selected ? capped + 4 : capped;
};

const NigeriaMapLeaflet: React.FC<NigeriaMapProps> = ({
  onStateClick,
  selectedState,
  stateCounts = {}
}) => {
  const dark = useMapFollowsDarkMode();

  const markers = useMemo(() => {
    return nigeriaStates.map(state => {
      const latLng = stateMapLatLng[state.name];
      if (!latLng) return null;

      const count = stateCounts[state.name] || 0;
      const isSelected = selectedState?.name === state.name;
      const fill = isSelected ? '#ea580c' : getCountColor(count);
      const stroke = dark ? '#1f2937' : '#ffffff';

      return (
        <CircleMarker
          key={state.name}
          center={latLng}
          radius={bubbleRadiusPx(count, isSelected)}
          pathOptions={{
            fillColor: fill,
            color: stroke,
            weight: isSelected ? 3 : 1.5,
            opacity: 1,
            fillOpacity: isSelected ? 0.95 : count === 0 ? 0.35 : 0.82
          }}
          eventHandlers={{
            click: () => onStateClick(state)
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -6]}
            opacity={1}
            className="!rounded-md !border-0 !px-2 !py-1 !text-xs !font-semibold !shadow-md dark:!bg-gray-800 dark:!text-gray-100"
          >
            <span className="block font-bold text-gray-900 dark:text-white">{state.name}</span>
            <span className="text-gray-600 dark:text-gray-300">
              {count} headline{count === 1 ? '' : 's'}
            </span>
          </Tooltip>
        </CircleMarker>
      );
    });
  }, [dark, onStateClick, selectedState, stateCounts]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner">
      <MapContainer
        center={NIGERIA_MAP_CENTER}
        zoom={NIGERIA_DEFAULT_ZOOM}
        minZoom={5}
        maxZoom={11}
        maxBounds={NIGERIA_BOUNDS}
        maxBoundsViscosity={0.9}
        scrollWheelZoom
        className="z-0 h-[min(520px,72vh)] w-full rounded-xl [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-attribution]:bg-white/90 [&_.leaflet-control-attribution]:dark:bg-gray-900/90"
        aria-label="Map of Nigeria with headline counts by state"
      >
        <MapThemeTiles dark={dark} />
        {markers}
      </MapContainer>
    </div>
  );
};

const NigeriaMap: React.FC<NigeriaMapProps> = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalHeadlines = Object.values(props.stateCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <MapPin className="h-5 w-5 text-orange-500" />
          Nigeria — live map
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          OpenStreetMap basemap with bubble size and color by headline mentions. Click a bubble for
          state details.
        </p>
      </div>

      {!mounted ? (
        <div
          className="flex h-[min(520px,72vh)] w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Loading map…
          </div>
        </div>
      ) : (
        <NigeriaMapLeaflet {...props} />
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">None</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">1–4</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-sky-500" />
          <span className="text-gray-600 dark:text-gray-400">5–14</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-gray-600 dark:text-gray-400">15–29</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-600" />
          <span className="text-gray-600 dark:text-gray-400">30+</span>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
        {totalHeadlines} headline{totalHeadlines === 1 ? '' : 's'} in current feed data
      </p>

      {props.selectedState && (
        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="font-semibold text-orange-900 dark:text-orange-100">
                {props.selectedState.name} State
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {props.selectedState.capital} • {props.selectedState.region}
              </p>
            </div>
            {(props.stateCounts?.[props.selectedState.name] || 0) > 0 && (
              <div className="flex items-center gap-1 rounded bg-white px-2 py-1 dark:bg-gray-700">
                <Zap className="h-4 w-4 text-orange-500" />
                <span className="font-bold text-orange-600 dark:text-orange-300">
                  {props.stateCounts![props.selectedState.name]}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NigeriaMap;
