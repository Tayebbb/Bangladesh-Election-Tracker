'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Result, Party } from '@/types';
import { MAP_CONFIG } from '@/lib/constants';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { getWinnerDisplayName } from '@/lib/alliances';

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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapRef.current || leafletMap.current) return;

      try {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load everything in parallel
        const [L, boundaryData, districtsData] = await Promise.all([
          import('leaflet').then(m => m.default),
          fetch('/data/geojson/boundary.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/data/geojson/districts.json').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        if (cancelled || !mapRef.current) return;

        const map = L.map(mapRef.current, {
          center: MAP_CONFIG.CENTER,
          zoom: MAP_CONFIG.ZOOM,
          minZoom: MAP_CONFIG.MIN_ZOOM,
          maxZoom: MAP_CONFIG.MAX_ZOOM,
          maxBounds: MAP_CONFIG.BOUNDS,
          maxBoundsViscosity: 1.0,
          zoomControl: true,
          attributionControl: true,
        });

        leafletMap.current = map;

        // ── Custom panes ──────────────────────────────────────────
        // maskPane sits between tiles (z=200) and overlayPane (z=400)
        map.createPane('maskPane');
        const maskPaneEl = map.getPane('maskPane')!;
        maskPaneEl.style.zIndex = '350';
        maskPaneEl.style.pointerEvents = 'none';

        // districtPane sits above mask
        map.createPane('districtPane');
        const districtPaneEl = map.getPane('districtPane')!;
        districtPaneEl.style.zIndex = '450';

        // borderPane on top of everything
        map.createPane('borderPane');
        const borderPaneEl = map.getPane('borderPane')!;
        borderPaneEl.style.zIndex = '460';
        borderPaneEl.style.pointerEvents = 'none';

        // ── Separate renderers ────────────────────────────────────
        // Canvas renderer for the mask (physically separate from SVG)
        const maskRenderer = L.canvas({ pane: 'maskPane' });
        // SVG renderer for districts (own SVG element, not shared)
        const districtRenderer = L.svg({ pane: 'districtPane' });

        // OSM Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        // ============================================================
        // STEP 1: Mask everything outside Bangladesh (Canvas renderer)
        // ============================================================
        if (boundaryData?.features?.length) {
          const geom = boundaryData.features[0].geometry;
          const holes: L.LatLngExpression[][] = [];

          if (geom.type === 'MultiPolygon') {
            for (const poly of geom.coordinates) {
              holes.push(poly[0].map((c: number[]) => [c[1], c[0]] as [number, number]));
            }
          } else if (geom.type === 'Polygon') {
            holes.push(geom.coordinates[0].map((c: number[]) => [c[1], c[0]] as [number, number]));
          }

          const worldOuter: L.LatLngExpression[] = [[-90, -180], [-90, 180], [90, 180], [90, -180]];

          L.polygon([worldOuter, ...holes], {
            renderer: maskRenderer,
            fillColor: '#e2e8f0',
            fillOpacity: 1,
            stroke: false,
            interactive: false,
          }).addTo(map);
        }

        // ============================================================
        // STEP 2: District borders (separate SVG renderer)
        // ============================================================
        if (districtsData?.features?.length) {
          console.log(`[MapView] Drawing ${districtsData.features.length} districts`);

          const districtLayer = (L.geoJSON as any)(districtsData, {
            renderer: districtRenderer,
            pane: 'districtPane',
            style: (feature: any) => {
              const id = feature?.properties?.id || '';
              const info = colorMap[id];
              return {
                fillColor: info?.color || 'transparent',
                fillOpacity: info ? 0.4 : 0,
                weight: 2,
                color: '#000000',
                opacity: 1,
              };
            },
            onEachFeature: (feature: any, featureLayer: any) => {
              const id = feature?.properties?.id || '';
              const name = feature?.properties?.name || id;
              const division = feature?.properties?.division || '';
              const info = colorMap[id];

              const tip = info
                ? `<strong>${name} District</strong><br/>Division: ${division}<br/>Party: ${info.partyName}<br/>Votes: ${formatNumber(info.totalVotes)}<br/>Margin: ${formatNumber(info.margin)}<br/>Turnout: ${formatPercentage(info.turnout)}`
                : `<strong>${name} District</strong><br/>Division: ${division}`;

              featureLayer.bindTooltip(tip, { sticky: true });

              featureLayer.on({
                mouseover: (e: any) => {
                  e.target.setStyle({ weight: 3, color: '#ff0000', fillOpacity: 0.3 });
                  e.target.bringToFront();
                },
                mouseout: (e: any) => {
                  districtLayer.resetStyle(e.target);
                },
                click: () => {
                  if (onConstituencyClick) onConstituencyClick(id);
                },
              });
            },
          }).addTo(map);

          geoLayer.current = districtLayer;
          console.log(`[MapView] District layer added with ${districtLayer.getLayers().length} sub-layers`);
        }

        // ============================================================
        // STEP 3: Country border on top
        // ============================================================
        if (boundaryData?.features?.length) {
          L.geoJSON(boundaryData, {
            pane: 'borderPane',
            style: {
              fillColor: 'transparent',
              fillOpacity: 0,
              weight: 3,
              color: '#000000',
              opacity: 1,
            },
            interactive: false,
          }).addTo(map);

          map.fitBounds(L.geoJSON(boundaryData).getBounds(), { padding: [20, 20] });
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load map');
          setLoading(false);
          console.error('MapView error:', err);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStyles = useCallback(() => {
    if (!geoLayer.current) return;
    geoLayer.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      if (!feature) return;
      const id = feature.properties?.id || '';
      const info = colorMap[id];
      layer.setStyle({
        fillColor: info?.color || 'transparent',
        fillOpacity: info ? 0.4 : 0,
        weight: 2,
        color: '#000000',
        opacity: 1,
      });
    });
  }, [colorMap]);

  useEffect(() => { updateStyles(); }, [updateStyles]);

  if (error) {
    return (
      <div className="flex h-[500px] sm:h-[550px] lg:h-[650px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
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
      <div ref={mapRef} className="h-[500px] sm:h-[550px] w-full rounded-lg border border-gray-200 lg:h-[650px] bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
