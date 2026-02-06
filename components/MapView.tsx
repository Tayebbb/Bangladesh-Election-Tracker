'use client';

/* Lightweight Leaflet wrapper loaded dynamically to avoid SSR issues.
   Uses dynamic import via Next.js to keep initial bundle small. */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Result, Party } from '@/types';
import { MAP_CONFIG } from '@/lib/constants';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { getWinnerDisplayName } from '@/lib/alliances';

// Lazy-load Leaflet types
type LMap = import('leaflet').Map;
type LGeoJSON = import('leaflet').GeoJSON;

interface Props {
  results: Result[];
  parties: Party[];
  onConstituencyClick?: (id: string) => void;
}

export default function MapView({ results, parties, onConstituencyClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<LMap | null>(null);
  const geoLayer = useRef<LGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build color lookup: constituencyId -> party color
  const colorMap = useMemo(() => {
    const map: Record<string, { color: string; partyName: string; winnerPartyId: string | null; status: string; totalVotes: number; margin: number; turnout: number }> = {};
    results.forEach(r => {
      let color = '#E5E7EB';
      let partyName = 'Pending';
      let winnerPartyId: string | null = null;
      if (r.status === 'completed' && r.winnerPartyId) {
        const p = parties.find(x => x.id === r.winnerPartyId);
        if (p) { 
          color = p.color; 
          partyName = getWinnerDisplayName(r.winnerPartyId, true);
          winnerPartyId = r.winnerPartyId;
        }
      } else if (r.status === 'partial') {
        const leader = Object.entries(r.partyVotes).sort(([, a], [, b]) => b - a)[0];
        if (leader) {
          const p = parties.find(x => x.id === leader[0]);
          if (p) { 
            color = p.color + '99'; 
            partyName = `${getWinnerDisplayName(leader[0], true)} (leading)`;
            winnerPartyId = leader[0];
          }
        }
      }
      map[r.constituencyId] = { color, partyName, winnerPartyId, status: r.status, totalVotes: r.totalVotes, margin: r.margin, turnout: r.turnoutPercentage };
    });
    return map;
  }, [results, parties]);

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapRef.current || leafletMap.current) return;

      try {
        const L = (await import('leaflet')).default;

        // Inject Leaflet CSS once
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const map = L.map(mapRef.current, {
          center: MAP_CONFIG.CENTER,
          zoom: MAP_CONFIG.ZOOM,
          minZoom: MAP_CONFIG.MIN_ZOOM,
          maxZoom: MAP_CONFIG.MAX_ZOOM,
          maxBounds: MAP_CONFIG.BOUNDS,
          zoomControl: true,
          attributionControl: true,
          preferCanvas: true, // Better perf for many features
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(map);

        if (cancelled) { map.remove(); return; }
        leafletMap.current = map;

        // Load GeoJSON
        const [boundaryRes, districtsRes] = await Promise.all([
          fetch('/data/geojson/boundary.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/data/geojson/districts.json').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        if (cancelled) return;

        const geoData = districtsRes || boundaryRes;
        if (geoData) {
          const layer = L.geoJSON(geoData, {
            style: (feature) => {
              const id = feature?.properties?.id || feature?.properties?.NAME_2 || '';
              const info = colorMap[id];
              return {
                fillColor: info?.color || '#E5E7EB',
                fillOpacity: 0.6,
                weight: 1,
                color: '#fff',
                opacity: 0.8,
              };
            },
            onEachFeature: (feature, layer) => {
              const id = feature?.properties?.id || feature?.properties?.NAME_2 || '';
              const name = feature?.properties?.name || feature?.properties?.NAME_2 || id;
              const info = colorMap[id];

              // Tooltip on hover
              const tooltipContent = info
                ? `<strong>${name}</strong><br/>
                   Party: ${info.partyName}<br/>
                   Votes: ${formatNumber(info.totalVotes)}<br/>
                   Margin: ${formatNumber(info.margin)}<br/>
                   Turnout: ${formatPercentage(info.turnout)}`
                : `<strong>${name}</strong><br/>No results yet`;

              layer.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-tooltip' });

              layer.on({
                mouseover: (e) => {
                  const target = e.target;
                  target.setStyle({ weight: 2, color: '#333', fillOpacity: 0.8 });
                  target.bringToFront();
                },
                mouseout: (e) => {
                  geoLayer.current?.resetStyle(e.target);
                },
                click: () => {
                  if (onConstituencyClick) onConstituencyClick(id);
                },
              });
            },
          }).addTo(map);

          geoLayer.current = layer;
          map.fitBounds(layer.getBounds());
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load map');
          setLoading(false);
          console.error(err);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      leafletMap.current?.remove();
      leafletMap.current = null;
      geoLayer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update feature styles when results change
  const updateStyles = useCallback(() => {
    if (!geoLayer.current) return;
    geoLayer.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      if (!feature) return;
      const id = feature.properties?.id || feature.properties?.NAME_2 || '';
      const info = colorMap[id];
      layer.setStyle({
        fillColor: info?.color || '#E5E7EB',
        fillOpacity: 0.6,
        weight: 1,
        color: '#fff',
        opacity: 0.8,
      });
    });
  }, [colorMap]);

  useEffect(() => { updateStyles(); }, [updateStyles]);

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-bd-green" />
        </div>
      )}
      <div ref={mapRef} className="h-[400px] w-full rounded-lg border border-gray-200 lg:h-[600px]" />
    </div>
  );
}
