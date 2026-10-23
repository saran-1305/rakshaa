import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DisasterScenario } from '../../data/syntheticScenarios';
import {
  Radio,
  X,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface GisSimulationMapProps {
  scenario: DisasterScenario;
  selectedSiteId?: string;
  onSelectSite?: (siteId: string) => void;
}

export const GisSimulationMap: React.FC<GisSimulationMapProps> = ({
  scenario,
  selectedSiteId: controlledSiteId,
  onSelectSite
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const activeRingLayerRef = useRef<L.LayerGroup | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);

  const [mapMode, setMapMode] = useState<'satellite' | 'streets'>('satellite');
  const [internalSelectedSiteId, setInternalSelectedSiteId] = useState<string | null>(null);

  // Progressive Concentric Ring Search State
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(15.0);
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(false);

  const scanIntervalRef = useRef<any>(null);

  const activeSiteId = controlledSiteId ?? internalSelectedSiteId;
  const selectedSite = scenario.candidate_sanctuaries.find((s) => s.id === activeSiteId);

  // 1. Initialize Map and Resize Observer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [scenario.centroid.lat, scenario.centroid.lon],
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // High-resolution satellite basemap (ESRI World Imagery - Keyless & unwatermarked)
      const baseTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'ESRI World Imagery'
        }
      ).addTo(map);

      baseLayerRef.current = baseTile;
      layersRef.current = L.layerGroup().addTo(map);
      activeRingLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      setTimeout(() => {
        map.invalidateSize();
      }, 350);
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

  // 2. Switch between satellite imagery and openstreetmap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }

    const newLayer =
      mapMode === 'satellite'
        ? L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              maxZoom: 19,
              attribution: 'ESRI World Imagery'
            }
          )
        : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'OpenStreetMap'
          });

    newLayer.addTo(map);
    baseLayerRef.current = newLayer;
    newLayer.bringToBack();
  }, [mapMode]);

  // 3. Automated progressive search expansion animation
  useEffect(() => {
    if (isAutoScanning) {
      scanIntervalRef.current = setInterval(() => {
        setSearchRadiusKm((prev) => {
          if (prev >= 15.0) {
            setIsAutoScanning(false);
            return 15.0;
          }
          return Number((prev + 0.15).toFixed(2));
        });
      }, 50);
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isAutoScanning]);

  const handleStartScan = () => {
    setSearchRadiusKm(2.0);
    setIsAutoScanning(true);
  };

  const handleToggleAutoScan = () => {
    if (searchRadiusKm >= 15.0) {
      setSearchRadiusKm(2.0);
      setIsAutoScanning(true);
    } else {
      setIsAutoScanning(!isAutoScanning);
    }
  };

  const handleJumpRing = (radius: number) => {
    setIsAutoScanning(false);
    setSearchRadiusKm(radius);
  };

  // Compute live progressive stats
  const discoveredSites = useMemo(() => {
    return scenario.candidate_sanctuaries.filter((s) => s.distance_km <= searchRadiusKm);
  }, [scenario.candidate_sanctuaries, searchRadiusKm]);

  const approvedSitesInRange = useMemo(() => {
    return discoveredSites.filter((s) => s.status === 'APPROVED');
  }, [discoveredSites]);

  const safeCapacityInRange = useMemo(() => {
    return approvedSitesInRange.reduce((sum, s) => sum + s.sphere_capacity_persons, 0);
  }, [approvedSitesInRange]);

  const coveragePercent = Math.min(
    100,
    Math.round((safeCapacityInRange / (scenario.displaced_population || 1)) * 100)
  );

  // 4. Update layers and draw expanding search wave whenever scenario, searchRadiusKm or activeSiteId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const { lat, lon } = scenario.centroid;
    map.setView([lat, lon], 12, { animate: true });

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Dynamic AOI Hazard Polygon
    L.circle([lat, lon], {
      radius: 2800,
      color: '#FF5A36',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#FF5A36',
      fillOpacity: 0.18
    })
      .bindTooltip(`Dynamic AOI Hazard Envelope: ${scenario.hazard_type}`, { permanent: false })
      .addTo(group);

    // Concentric Reference Ring 1 (5 km)
    L.circle([lat, lon], {
      radius: 5000,
      color: '#00E5FF',
      weight: 1,
      dashArray: '4, 6',
      fillColor: 'transparent',
      opacity: 0.45
    })
      .bindTooltip('Ring 1 Reference Boundary (5 km)', { permanent: false, direction: 'top' })
      .addTo(group);

    // Concentric Reference Ring 2 (10 km)
    L.circle([lat, lon], {
      radius: 10000,
      color: '#84FFFF',
      weight: 1,
      dashArray: '3, 6',
      fillColor: 'transparent',
      opacity: 0.35
    })
      .bindTooltip('Ring 2 Reference Boundary (10 km)', { permanent: false, direction: 'top' })
      .addTo(group);

    // Concentric Reference Ring 3 (15 km)
    L.circle([lat, lon], {
      radius: 15000,
      color: '#B2EBF2',
      weight: 1,
      dashArray: '2, 6',
      fillColor: 'transparent',
      opacity: 0.25
    })
      .bindTooltip('Ring 3 Search Boundary (15 km)', { permanent: false, direction: 'top' })
      .addTo(group);

    // Centroid Hazard Marker
    const hazardIcon = L.divIcon({
      className: 'custom-hazard-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 bg-red-500/40 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([lat, lon], { icon: hazardIcon })
      .bindPopup(`
        <div style="color: #111; font-family: sans-serif; padding: 4px; min-width: 170px;">
          <h4 style="margin: 0; font-weight: bold; color: #d32f2f;">${scenario.name}</h4>
          <p style="margin: 4px 0 0; font-size: 11px;">Hazard: <strong>${scenario.hazard_type}</strong></p>
          <p style="margin: 2px 0 0; font-size: 11px;">Displaced Pop: <strong>${scenario.displaced_population.toLocaleString()}</strong></p>
          <p style="margin: 2px 0 0; font-size: 10px; color: #666;">Bearing ${scenario.hazard_summary.flow_vector.bearing_deg}° at ${scenario.hazard_summary.flow_vector.speed_mps} m/s</p>
        </div>
      `)
      .addTo(group);

    // Candidate Sanctuaries: Highlighting sites within the expanding search radius
    scenario.candidate_sanctuaries.forEach((site) => {
      const isApproved = site.status === 'APPROVED';
      const isSelected = site.id === activeSiteId;
      const isInRange = site.distance_km <= searchRadiusKm;

      const markerHtml = isInRange
        ? isApproved
          ? `
            <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer transform ${isSelected ? 'scale-125' : 'hover:scale-110'} transition-transform">
              <div class="absolute inset-0 rounded-full bg-cyan-400/30 animate-pulse"></div>
              <div class="w-5 h-5 bg-cyan-400 border-2 border-black rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold text-black">✓</div>
            </div>
          `
          : `
            <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer transform ${isSelected ? 'scale-125' : 'hover:scale-110'} transition-transform">
              <div class="w-5 h-5 bg-red-600 border-2 border-black rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold text-white">✕</div>
            </div>
          `
        : `
          <div class="w-4 h-4 bg-white/20 border border-white/40 rounded-full flex items-center justify-center text-[8px] text-white/50 opacity-40">
            ○
          </div>
        `;

      const siteIcon = L.divIcon({
        className: 'custom-site-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([site.lat, site.lon], {
        icon: siteIcon,
        opacity: isInRange ? 1.0 : 0.35
      }).addTo(group);

      if (isInRange) {
        // Connect corridor polyline from centroid to candidate
        L.polyline([[lat, lon], [site.lat, site.lon]], {
          color: isApproved ? '#00E5FF' : '#FF5A36',
          weight: isSelected ? 3 : 1.5,
          opacity: isSelected ? 0.95 : 0.65,
          dashArray: isApproved ? '5, 5' : '2, 6'
        }).addTo(group);

        const popupHtml = `
          <div style="color: #111; font-family: sans-serif; min-width: 190px; padding: 4px;">
            <h4 style="margin: 0; font-weight: bold; color: ${isApproved ? '#00838f' : '#c62828'};">${site.name}</h4>
            <p style="margin: 4px 0 2px; font-size: 11px;">Status: <strong>${site.status}</strong></p>
            <p style="margin: 2px 0 2px; font-size: 11px;">Distance: <strong>${site.distance_km} km</strong> (${site.ring})</p>
            <p style="margin: 2px 0 2px; font-size: 11px;">Slope: <strong>${site.slope_deg}°</strong> | Sphere Cap: <strong>${site.sphere_capacity_persons}</strong></p>
            ${!isApproved && site.veto_reasons ? `<p style="margin: 4px 0 0; font-size: 10px; color: #b71c1c; font-weight: 600;">Veto: ${site.veto_reasons.join(', ')}</p>` : ''}
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          setInternalSelectedSiteId(site.id);
          if (onSelectSite) onSelectSite(site.id);
        });
      }
    });
  }, [scenario, activeSiteId, onSelectSite, searchRadiusKm]);

  // 5. Separate layer to smoothly redraw ONLY the active expanding search radar ring
  useEffect(() => {
    const ringGroup = activeRingLayerRef.current;
    if (!ringGroup) return;

    ringGroup.clearLayers();

    const { lat, lon } = scenario.centroid;
    const radiusMeters = searchRadiusKm * 1000;

    // Outer Animated Glowing Wave Ring
    L.circle([lat, lon], {
      radius: radiusMeters,
      color: '#00E5FF',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#00E5FF',
      fillOpacity: 0.08
    }).addTo(ringGroup);

    // Inner Secondary Pulse Ring
    L.circle([lat, lon], {
      radius: Math.max(100, radiusMeters - 600),
      color: '#84FFFF',
      weight: 1,
      dashArray: '2, 4',
      fillColor: 'transparent',
      opacity: 0.6
    }).addTo(ringGroup);
  }, [scenario.centroid, searchRadiusKm]);

  // Phase messaging based on active expansion range
  const currentPhase =
    searchRadiusKm <= 5.2
      ? {
          title: 'PHASE 1: RING 1 IMMEDIATE SEARCH (0–5 KM)',
          desc: 'Evaluating closest candidate parcels against Zero-Tolerance Hard Veto slope thresholds.',
          statusColor: 'text-amber-400'
        }
      : searchRadiusKm <= 10.2
      ? {
          title: 'PHASE 2: RING 2 INTERMEDIATE EXPANSION (5–10 KM)',
          desc: 'Closest Safe Ground search radius expanding outward. Identifying primary educational & civic complexes.',
          statusColor: 'text-cyan-400'
        }
      : {
          title: 'PHASE 3: RING 3 EXTENDED SANCTUARY (10–15 KM)',
          desc: 'Final ring search boundary reached. Full Sphere Humanitarian capacity verified.',
          statusColor: 'text-emerald-400'
        };

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 flex flex-col bg-[#05080E] overflow-hidden select-none font-sans">
      {/* ─── 1. FULL-SCREEN LEAFLET CONTAINER ─── */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* ─── 2. TOP-LEFT TACTICAL INCIDENT HUD ─── */}
      <div className="absolute top-4 left-4 z-10 bg-black/85 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-lg pointer-events-auto text-xs font-mono space-y-1 shadow-2xl max-w-xs sm:max-w-sm">
        <div className="flex items-center gap-2 text-raksha-accent font-semibold tracking-wider">
          <Radio className="w-3.5 h-3.5 animate-pulse text-raksha-accent" />
          <span>GIS TACTICAL OVERVIEW</span>
        </div>
        <div className="text-white font-bold text-xs truncate">{scenario.name}</div>
        <div className="text-white/60 text-[11px] flex items-center gap-2">
          <span>
            Hazard: <strong className="text-red-400">{scenario.hazard_type}</strong>
          </span>
          <span>•</span>
          <span>
            Index: <strong className="text-amber-400">{scenario.hazard_summary.computed_hazard_index}</strong>
          </span>
        </div>
        <div className="text-white/50 text-[10px]">
          Centroid: {scenario.centroid.lat.toFixed(4)}° N, {scenario.centroid.lon.toFixed(4)}° E
        </div>
      </div>

      {/* ─── 3. TOP-CENTER PROGRESSIVE SEARCH EXPANSION CONTROLLER (DYNAMIC RANGE) ─── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#090E17]/95 backdrop-blur-xl border border-cyan-500/50 rounded-xl px-4 py-2.5 font-mono shadow-[0_0_30px_rgba(6,182,212,0.25)] flex flex-col gap-2 max-w-xl w-[92%] sm:w-auto pointer-events-auto">
        {/* Header: Play/Pause and Phase Indicator */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAutoScan}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                isAutoScanning
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-md shadow-cyan-400/20'
              }`}
              title="Toggle automatic progressive ring expansion simulation"
            >
              {isAutoScanning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE SWEEP</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{searchRadiusKm >= 15 ? 'REPLAY SWEEP' : 'EXPAND RANGE'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleStartScan}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Reset search to 0 km"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Range Readout */}
          <div className="flex items-center gap-2 text-right">
            <span className="text-white/50 text-[10px]">SEARCH RADIUS:</span>
            <span className="text-sm font-bold text-cyan-300 tracking-wider">
              {searchRadiusKm.toFixed(1)} km
            </span>
          </div>
        </div>

        {/* Range Slider & Quick-Jump Buttons */}
        <div className="flex items-center gap-2.5 pt-1 border-t border-white/10">
          <span className="text-[10px] text-white/40">3km</span>
          <input
            type="range"
            min={3.0}
            max={15.0}
            step={0.1}
            value={searchRadiusKm}
            onChange={(e) => {
              setIsAutoScanning(false);
              setSearchRadiusKm(parseFloat(e.target.value));
            }}
            className="w-40 sm:w-56 accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
          />
          <span className="text-[10px] text-white/40">15km</span>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => handleJumpRing(5.0)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                searchRadiusKm <= 5.5
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Ring 1 (5k)
            </button>
            <button
              onClick={() => handleJumpRing(10.0)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                searchRadiusKm > 5.5 && searchRadiusKm <= 10.5
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Ring 2 (10k)
            </button>
            <button
              onClick={() => handleJumpRing(15.0)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                searchRadiusKm > 10.5
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Ring 3 (15k)
            </button>
          </div>
        </div>

        {/* Live Expansion Metrics Banner */}
        <div className="flex items-center justify-between gap-3 text-[10px] pt-1 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${currentPhase.statusColor}`}>{currentPhase.title}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-white/60">
              Discovered Safe Cap:{' '}
              <strong className="text-emerald-400">{safeCapacityInRange.toLocaleString()}</strong> /{' '}
              {scenario.displaced_population.toLocaleString()}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                coveragePercent >= 100
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}
            >
              {coveragePercent}% COVERAGE
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. TOP-RIGHT MAP MODE SWITCHER ─── */}
      <div className="absolute top-4 right-14 z-10 flex items-center bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-1 font-mono text-xs shadow-2xl pointer-events-auto">
        <button
          onClick={() => setMapMode('satellite')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            mapMode === 'satellite'
              ? 'bg-raksha-accent text-black shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🛰️ ESRI Satellite
        </button>
        <button
          onClick={() => setMapMode('streets')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
            mapMode === 'streets'
              ? 'bg-raksha-accent text-black shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🗺️ Topo / Streets
        </button>
      </div>

      {/* ─── 5. BOTTOM-LEFT SELECTED SITE INSPECTOR CARD ─── */}
      {selectedSite && (
        <div className="absolute bottom-6 left-6 z-20 bg-black/95 backdrop-blur-2xl border border-cyan-500/40 p-4 rounded-xl font-mono text-xs shadow-2xl max-w-sm pointer-events-auto animate-fade-in border-l-4 border-l-cyan-400">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2 font-bold text-white">
              {selectedSite.status === 'APPROVED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className="truncate max-w-[240px]">{selectedSite.name}</span>
            </div>
            <button
              onClick={() => setInternalSelectedSiteId(null)}
              className="text-white/50 hover:text-white p-0.5 rounded cursor-pointer"
              aria-label="Close site inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-white/70">
              <span>Audit Decision:</span>
              <span
                className={
                  selectedSite.status === 'APPROVED' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
                }
              >
                {selectedSite.status}
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Geodesic Distance:</span>
              <span className="text-white font-medium">
                {selectedSite.distance_km} km ({selectedSite.ring})
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Terrain Slope:</span>
              <span
                className={
                  selectedSite.slope_deg > 14 || selectedSite.slope_deg < 2
                    ? 'text-red-400 font-bold'
                    : 'text-emerald-400 font-bold'
                }
              >
                {selectedSite.slope_deg}°
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Sphere Capacity:</span>
              <span className="text-cyan-300 font-bold">
                {selectedSite.sphere_capacity_persons.toLocaleString()} Persons (45 m² standard)
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Multi-Criteria Utility:</span>
              <span className="text-amber-300 font-bold">{selectedSite.mcda_score} / 100</span>
            </div>
            {selectedSite.veto_reasons && (
              <div className="mt-2 pt-2 border-t border-red-500/30 text-red-300 text-[10px] leading-relaxed">
                ⚠️ <strong>ZERO-TOLERANCE HARD VETO:</strong> {selectedSite.veto_reasons.join(' • ')}
              </div>
            )}
            {selectedSite.status === 'APPROVED' && (
              <div className="mt-2 pt-2 border-t border-emerald-500/30 text-emerald-300 text-[10px]">
                ✓ <strong>SPHERE CERTIFIED:</strong> Safe terrain verified outside hazard flood/debris perimeter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 6. BOTTOM-RIGHT COMPACT LEGEND BADGE ─── */}
      <div className="absolute bottom-6 right-6 z-10 bg-black/90 backdrop-blur-md border border-white/15 px-3 py-2.5 rounded-lg pointer-events-none text-[10px] font-mono space-y-1.5 shadow-2xl hidden sm:block">
        <div className="text-white/40 border-b border-white/10 pb-1 flex justify-between">
          <span>PROGRESSIVE CONCENTRIC SEARCH</span>
          <span>5km ➔ 10km ➔ 15km</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white/90">Hazard Origin & AOI Polygon</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-white/90">Approved Sanctuary (In Range)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span className="text-white/90">Hard Veto Disqualified Site</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 border-b border-dashed border-cyan-400" />
          <span className="text-cyan-300 font-bold">Active Expanding Search Wave</span>
        </div>
      </div>
    </div>
  );
};
