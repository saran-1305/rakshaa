import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient, type GlobalIncident, type GlobalIncidentsResponse } from '../../services/apiClient';
import {
  RefreshCw,
  Search,
  X,
  ArrowRight,
  Flame,
  Zap,
  Wind,
  Droplets,
  AlertTriangle,
  Layers
} from 'lucide-react';

interface GlobalIntelligenceMapProps {
  onSelectIncident: (incident: GlobalIncident) => void;
}

export const GlobalIntelligenceMap: React.FC<GlobalIntelligenceMapProps> = ({
  onSelectIncident
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [incidents, setIncidents] = useState<GlobalIncident[]>([]);
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<GlobalIncident | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapMode, setMapMode] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [currentZoom, setCurrentZoom] = useState<number>(2);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 1. Fetch live global incidents from FastAPI backend
  const fetchIncidents = async (refresh: boolean = false) => {
    setIsLoading(true);
    try {
      const data: GlobalIncidentsResponse = await apiClient.getGlobalIncidents({
        category: activeCategory !== 'all' ? activeCategory : undefined,
        include_demo: true,
        refresh
      });
      setIncidents(data.incidents || []);
      setProviders(data.providers || {});
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // If backend fails, use fallback presets
      const fallbackPresets = await apiClient.getPresets().catch(() => []);
      const mapped = fallbackPresets.map((p) => ({
        id: p.id,
        provider: 'RAKSHA_BENCHMARK',
        provider_event_id: p.id,
        title: p.name,
        place: p.name,
        hazard_category: (p.hazard_type.toLowerCase().includes('flood') ? 'flood' : 'landslide') as any,
        hazard_type: p.hazard_type,
        lat: p.lat,
        lon: p.lon,
        depth_km: 0,
        severity: 0.85,
        severity_unit: 'hazard_index',
        alert_level: 'critical' as const,
        event_time: new Date().toISOString(),
        updated_time: new Date().toISOString(),
        source_url: 'https://nrsc.gov.in',
        is_demo_preset: true,
        can_run_relocation_analysis: true,
        default_population: p.default_population,
        provenance: 'LOCAL_FALLBACK',
        description: p.description
      }));
      setIncidents(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [activeCategory]);

  // 2. Initialize Leaflet World Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Base tile layer: Keyless ESRI Dark Canvas Tactical
      const baseTile = L.tileLayer(
        'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
          attribution: 'ESRI Dark Canvas'
        }
      ).addTo(map);

      baseLayerRef.current = baseTile;
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Invalidate size on initial mount
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 400);
    }

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Switch Base Map Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }

    let url = 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 16;
    let subdomains = '';

    if (mapMode === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
      subdomains = '';
    } else if (mapMode === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
      subdomains = 'abc';
    }

    const newLayer = L.tileLayer(url, { maxZoom, subdomains }).addTo(map);
    baseLayerRef.current = newLayer;
    newLayer.bringToBack();
  }, [mapMode]);

  // 4. Filter incidents by category & search query
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = inc.title.toLowerCase().includes(q) || inc.place.toLowerCase().includes(q);
        const matchesCategory = inc.hazard_category.toLowerCase().includes(q) || inc.hazard_type.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
      }
      return true;
    });
  }, [incidents, searchQuery]);

  // 5. Render clustered & individual markers based on current zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const zoom = map.getZoom();

    // At low zoom (zoom <= 4), cluster nearby incidents within pixel threshold
    if (zoom <= 4) {
      const clusterPixelThreshold = 55;
      const clusters: {
        centerLat: number;
        centerLon: number;
        points: GlobalIncident[];
        hasCritical: boolean;
        hasWarning: boolean;
      }[] = [];

      filteredIncidents.forEach((inc) => {
        const pointPixel = map.latLngToLayerPoint([inc.lat, inc.lon]);
        let addedToCluster = false;

        for (const cluster of clusters) {
          const clusterPixel = map.latLngToLayerPoint([cluster.centerLat, cluster.centerLon]);
          const distance = Math.hypot(pointPixel.x - clusterPixel.x, pointPixel.y - clusterPixel.y);

          if (distance < clusterPixelThreshold) {
            cluster.points.push(inc);
            if (inc.alert_level === 'critical') cluster.hasCritical = true;
            if (inc.alert_level === 'warning') cluster.hasWarning = true;
            addedToCluster = true;
            break;
          }
        }

        if (!addedToCluster) {
          clusters.push({
            centerLat: inc.lat,
            centerLon: inc.lon,
            points: [inc],
            hasCritical: inc.alert_level === 'critical',
            hasWarning: inc.alert_level === 'warning'
          });
        }
      });

      clusters.forEach((cluster) => {
        // If single incident, render as normal pin
        if (cluster.points.length === 1) {
          const inc = cluster.points[0];
          renderSingleMarker(inc, map, layerGroup);
          return;
        }

        // Render cluster bubble
        const badgeColor = cluster.hasCritical
          ? 'bg-red-500/90 text-white border-red-300 shadow-[0_0_18px_rgba(239,68,68,0.7)]'
          : cluster.hasWarning
          ? 'bg-amber-500/90 text-black border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
          : 'bg-cyan-500/90 text-black border-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.6)]';

        const clusterHtml = `
          <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer transform hover:scale-110 transition-transform">
            <div class="absolute inset-0 rounded-full ${cluster.hasCritical ? 'bg-red-500/30' : 'bg-cyan-500/30'} animate-ping"></div>
            <div class="w-8 h-8 rounded-full border-2 font-mono font-bold text-xs flex items-center justify-center ${badgeColor}">
              ${cluster.points.length}
            </div>
          </div>
        `;

        const clusterIcon = L.divIcon({
          className: 'custom-cluster-marker',
          html: clusterHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const clusterMarker = L.marker([cluster.centerLat, cluster.centerLon], { icon: clusterIcon }).addTo(layerGroup);

        clusterMarker.bindTooltip(
          `<div class="font-mono text-xs font-bold text-white bg-black/90 p-1 rounded border border-white/20">
            Cluster: ${cluster.points.length} Events<br/>
            <span class="text-[10px] text-white/60">Click to zoom into sector</span>
          </div>`,
          { direction: 'top', className: 'dark-tooltip' }
        );

        clusterMarker.on('click', () => {
          map.setView([cluster.centerLat, cluster.centerLon], zoom + 2, { animate: true });
        });
      });
    } else {
      // Zoom >= 5: Render individual markers
      filteredIncidents.forEach((inc) => {
        renderSingleMarker(inc, map, layerGroup);
      });
    }
  }, [filteredIncidents, currentZoom]);

  const renderSingleMarker = (inc: GlobalIncident, _map: L.Map, layerGroup: L.LayerGroup) => {
    let glyph = '⚠️';
    let borderColor = 'border-amber-400';
    let bgColor = 'bg-amber-500/20';

    if (inc.is_demo_preset) {
      glyph = '🛡️';
      borderColor = 'border-cyan-400';
      bgColor = 'bg-cyan-500/30';
    } else if (inc.hazard_category === 'earthquake') {
      glyph = '⚡';
      borderColor = inc.severity >= 6.0 ? 'border-red-500' : 'border-amber-400';
      bgColor = inc.severity >= 6.0 ? 'bg-red-500/40' : 'bg-amber-500/30';
    } else if (inc.hazard_category === 'storm') {
      glyph = '🌪️';
      borderColor = 'border-cyan-400';
      bgColor = 'bg-cyan-500/30';
    } else if (inc.hazard_category === 'wildfire') {
      glyph = '🔥';
      borderColor = 'border-orange-500';
      bgColor = 'bg-orange-500/40';
    } else if (inc.hazard_category === 'volcano') {
      glyph = '🌋';
      borderColor = 'border-red-600';
      bgColor = 'bg-red-600/40';
    } else if (inc.hazard_category === 'flood') {
      glyph = '🌊';
      borderColor = 'border-teal-400';
      bgColor = 'bg-teal-500/30';
    }

    const isSelected = selectedIncident?.id === inc.id;

    const markerHtml = `
      <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer transform ${isSelected ? 'scale-125' : 'hover:scale-110'} transition-transform">
        ${inc.alert_level === 'critical' ? `<div class="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>` : ''}
        <div class="w-6 h-6 rounded-full border-2 ${borderColor} ${bgColor} flex items-center justify-center text-xs shadow-lg backdrop-blur-md">
          ${glyph}
        </div>
      </div>
    `;

    const markerIcon = L.divIcon({
      className: 'custom-incident-pin',
      html: markerHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([inc.lat, inc.lon], { icon: markerIcon }).addTo(layerGroup);

    // Desktop hover preview
    marker.bindTooltip(
      `<div style="font-family: monospace; padding: 4px; color: #fff; min-width: 170px;">
        <div style="font-weight: bold; font-size: 11px; color: #00E5FF;">${inc.title}</div>
        <div style="font-size: 10px; color: #ccc; margin-top: 2px;">${inc.place}</div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 2px;">
          <span>Category: <strong style="color: #FFB300;">${inc.hazard_type}</strong></span>
          <span style="color: #64FFDA;">${inc.provider}</span>
        </div>
      </div>`,
      { direction: 'top', opacity: 0.95 }
    );

    // Click: Select incident and open detail panel
    marker.on('click', () => {
      setSelectedIncident(inc);
    });
  };

  // Keyboard shortcut to close detail card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIncident(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 flex flex-col bg-[#05080E] overflow-hidden select-none font-sans">
      {/* ─── 1. TOP GLOBAL TOOLBAR & INCIDENT FILTERS ─── */}
      <div className="z-10 bg-[#070B13]/95 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Global Stats & Live Feeds */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold tracking-wider text-xs">GLOBAL DISASTER FEEDS</span>
          </div>
          <span className="text-white/20">|</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-bold">
            {filteredIncidents.length} EVENTS LOADED
          </span>

          {/* Provider Provenance Chips */}
          <div className="hidden lg:flex items-center gap-2 text-[10px]">
            {providers.usgs && (
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                USGS: <strong className="text-emerald-400">{providers.usgs.status}</strong> ({providers.usgs.count || 0})
              </span>
            )}
            {providers.nasa_eonet && (
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                NASA EONET: <strong className="text-emerald-400">{providers.nasa_eonet.status}</strong> ({providers.nasa_eonet.count || 0})
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
              DEMO PRESETS: <strong className="text-cyan-400">5 ACTIVE</strong>
            </span>
          </div>
        </div>

        {/* Center: Search & Categories */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white">
            <Search className="w-3.5 h-3.5 text-white/50" />
            <input
              type="text"
              placeholder="Filter country, region, event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none text-white text-xs placeholder:text-white/40 w-36 sm:w-48"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-white/50 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-0.5 bg-white/5 rounded-lg border border-white/10">
            {[
              { id: 'all', label: 'All', icon: Layers },
              { id: 'earthquake', label: 'Quakes', icon: Zap },
              { id: 'storm', label: 'Storms', icon: Wind },
              { id: 'wildfire', label: 'Fires', icon: Flame },
              { id: 'flood', label: 'Floods', icon: Droplets },
              { id: 'demo', label: 'Presets', icon: AlertTriangle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Map Layers & Refresh */}
        <div className="flex items-center gap-2">
          {/* Map Layer Mode */}
          <div className="flex items-center bg-black/60 border border-white/15 rounded-lg p-0.5">
            <button
              onClick={() => setMapMode('dark')}
              className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                mapMode === 'dark' ? 'bg-cyan-400 text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              DARK
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                mapMode === 'satellite' ? 'bg-cyan-400 text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              SAT
            </button>
            <button
              onClick={() => setMapMode('streets')}
              className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                mapMode === 'streets' ? 'bg-cyan-400 text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              TOPO
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => fetchIncidents(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-[11px] cursor-pointer transition-colors"
            title="Force refresh global disaster feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── 2. MAP CONTAINER ─── */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0 relative" />

      {/* ─── 3. BOTTOM-LEFT FLOATING INCIDENT INTEL CARD (ON SELECTION) ─── */}
      {selectedIncident && (
        <div className="absolute bottom-6 left-6 z-20 bg-[#090E17]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-xl p-4 shadow-2xl max-w-sm sm:max-w-md w-full pointer-events-auto font-mono text-xs animate-fade-in border-l-4 border-l-cyan-400">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2.5 mb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-bold">
                  {selectedIncident.provider}
                </span>
                {selectedIncident.is_demo_preset && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                    VERIFIED BENCHMARK
                  </span>
                )}
                <span className="text-white/40 text-[10px]">
                  {selectedIncident.event_time.slice(0, 10)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1.5 font-sans leading-snug">
                {selectedIncident.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close detail card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] mb-3.5">
            <div className="flex justify-between text-white/70">
              <span>Location Sector:</span>
              <span className="text-white font-medium text-right truncate max-w-[220px]">
                {selectedIncident.place}
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Geodetic Centroid:</span>
              <span className="text-cyan-300 font-bold">
                {selectedIncident.lat.toFixed(4)}° N, {selectedIncident.lon.toFixed(4)}° E
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Hazard Classification:</span>
              <span className="text-amber-400 font-bold">{selectedIncident.hazard_type}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Severity Measurement:</span>
              <span className="text-white">
                {selectedIncident.severity} {selectedIncident.severity_unit}
              </span>
            </div>
            {selectedIncident.default_population > 0 && (
              <div className="flex justify-between text-white/70">
                <span>Estimated Exposure:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedIncident.default_population.toLocaleString()} Persons
                </span>
              </div>
            )}
            {selectedIncident.description && (
              <p className="text-[10px] text-white/60 pt-1 border-t border-white/5 leading-relaxed">
                {selectedIncident.description}
              </p>
            )}
          </div>

          {/* Drill-Down Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectIncident(selectedIncident)}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black py-2.5 px-4 rounded-lg font-bold text-xs tracking-wider font-mono shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>OPEN INCIDENT COMMAND</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={selectedIncident.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[11px] font-mono transition-colors"
              title="Inspect raw provider bulletin"
            >
              Source ↗
            </a>
          </div>
        </div>
      )}

      {/* ─── 4. BOTTOM-RIGHT COMPACT LEGEND & TELEMETRY BADGE ─── */}
      <div className="absolute bottom-6 right-6 z-10 bg-black/85 backdrop-blur-md border border-white/15 px-3 py-2 rounded-lg pointer-events-none text-[10px] font-mono space-y-1 shadow-2xl hidden md:block">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1 text-white/40">
          <span>HAZARD KEY</span>
          <span>{lastUpdated ? `SYNC: ${lastUpdated}` : 'LIVE'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⚡</span>
          <span className="text-white/80">Earthquakes (USGS M4.5+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🌪️</span>
          <span className="text-white/80">Cyclones & Storms (NASA EONET)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🛡️</span>
          <span className="text-cyan-400 font-semibold">RAKSHA Verified Benchmarks</span>
        </div>
      </div>
    </div>
  );
};
