import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DisasterScenario } from '../../data/syntheticScenarios';
import { Radio, X, CheckCircle2, XCircle } from 'lucide-react';

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
  const baseLayerRef = useRef<L.TileLayer | null>(null);

  const [mapMode, setMapMode] = useState<'satellite' | 'streets'>('satellite');
  const [internalSelectedSiteId, setInternalSelectedSiteId] = useState<string | null>(null);

  const activeSiteId = controlledSiteId ?? internalSelectedSiteId;
  const selectedSite = scenario.candidate_sanctuaries.find((s) => s.id === activeSiteId);

  // Initialize Map and Resize Observer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [scenario.centroid.lat, scenario.centroid.lon],
        zoom: 12,
        zoomControl: false, // We'll position zoom control or keep it clean
        attributionControl: false
      });

      // Add zoom control to top-right below mode switcher
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
      mapInstanceRef.current = map;

      // Invalidate size on initial mount
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      setTimeout(() => {
        map.invalidateSize();
      }, 350);
    }

    // Observe container size changes (e.g., window resize or layout flex)
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

  // Switch between satellite imagery and openstreetmap
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

  // Update layers and center whenever scenario or activeSiteId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const { lat, lon } = scenario.centroid;
    map.setView([lat, lon], 12, { animate: true });

    // Ensure map redraws when switching scenarios
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // 1. Progressive Search Rings (5km, 10km)
    L.circle([lat, lon], {
      radius: 5000,
      color: '#00E5FF',
      weight: 1.5,
      dashArray: '4, 6',
      fillColor: '#00E5FF',
      fillOpacity: 0.04
    })
      .bindTooltip('Ring 1 (0–5 km Search Zone)', { permanent: false, direction: 'top' })
      .addTo(group);

    L.circle([lat, lon], {
      radius: 10000,
      color: '#84FFFF',
      weight: 1,
      dashArray: '3, 6',
      fillColor: '#84FFFF',
      fillOpacity: 0.02
    })
      .bindTooltip('Ring 2 (5–10 km Search Zone)', { permanent: false, direction: 'top' })
      .addTo(group);

    // 2. Dynamic AOI Hazard Polygon
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

    // 3. Hazard Centroid Marker with Pulse Icon
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

    // 4. Candidate Sanctuaries
    scenario.candidate_sanctuaries.forEach((site) => {
      const isApproved = site.status === 'APPROVED';
      const isSelected = site.id === activeSiteId;

      const markerHtml = isApproved
        ? `
          <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer transform ${isSelected ? 'scale-125' : 'hover:scale-110'} transition-transform">
            <div class="w-5 h-5 bg-cyan-400 border-2 border-black rounded-full shadow-md flex items-center justify-center text-[10px] font-bold text-black">✓</div>
          </div>
        `
        : `
          <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer transform ${isSelected ? 'scale-125' : 'hover:scale-110'} transition-transform">
            <div class="w-5 h-5 bg-red-600 border-2 border-black rounded-full shadow-md flex items-center justify-center text-[10px] font-bold text-white">✕</div>
          </div>
        `;

      const siteIcon = L.divIcon({
        className: 'custom-site-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([site.lat, site.lon], { icon: siteIcon }).addTo(group);

      // Connect corridor polyline from centroid
      L.polyline([[lat, lon], [site.lat, site.lon]], {
        color: isApproved ? '#00E5FF' : '#FF5A36',
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 0.95 : 0.45,
        dashArray: isApproved ? '5, 5' : '2, 6'
      }).addTo(group);

      const popupHtml = `
        <div style="color: #111; font-family: sans-serif; min-width: 190px; padding: 4px;">
          <h4 style="margin: 0; font-weight: bold; color: ${isApproved ? '#00838f' : '#c62828'};">${site.name}</h4>
          <p style="margin: 4px 0 2px; font-size: 11px;">Status: <strong>${site.status}</strong></p>
          <p style="margin: 2px 0 2px; font-size: 11px;">Distance: <strong>${site.distance_km} km</strong> (${site.ring})</p>
          <p style="margin: 2px 0 2px; font-size: 11px;">Slope: <strong>${site.slope_deg}°</strong> | Capacity: <strong>${site.sphere_capacity_persons}</strong></p>
          ${!isApproved && site.veto_reasons ? `<p style="margin: 4px 0 0; font-size: 10px; color: #b71c1c; font-weight: 600;">Veto: ${site.veto_reasons.join(', ')}</p>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setInternalSelectedSiteId(site.id);
        if (onSelectSite) onSelectSite(site.id);
      });
    });
  }, [scenario, activeSiteId, onSelectSite]);

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 flex flex-col bg-[#05080E] overflow-hidden">
      {/* 1. Full-Height Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* 2. Top-Left Floating Tactical Overview HUD */}
      <div className="absolute top-4 left-4 z-10 bg-black/85 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-lg pointer-events-auto text-xs font-mono space-y-1 shadow-2xl max-w-xs sm:max-w-sm">
        <div className="flex items-center gap-2 text-raksha-accent font-semibold tracking-wider">
          <Radio className="w-3.5 h-3.5 animate-pulse text-raksha-accent" />
          <span>GIS TACTICAL OVERVIEW</span>
        </div>
        <div className="text-white font-bold text-xs truncate">{scenario.name}</div>
        <div className="text-white/60 text-[11px] flex items-center gap-2">
          <span>Hazard: <strong className="text-red-400">{scenario.hazard_type}</strong></span>
          <span>•</span>
          <span>Index: <strong className="text-amber-400">{scenario.hazard_summary.computed_hazard_index}</strong></span>
        </div>
        <div className="text-white/50 text-[10px]">
          Bearing {scenario.hazard_summary.flow_vector.bearing_deg}° at {scenario.hazard_summary.flow_vector.speed_mps} m/s
        </div>
      </div>

      {/* 3. Top-Right Map Mode Switcher */}
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

      {/* 4. Bottom-Left Selected Site Inspector Card (Collapsible when site clicked) */}
      {selectedSite && (
        <div className="absolute bottom-4 left-4 z-10 bg-black/90 backdrop-blur-md border border-white/20 p-3.5 rounded-lg font-mono text-xs shadow-2xl max-w-sm pointer-events-auto animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2 font-bold text-white">
              {selectedSite.status === 'APPROVED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="truncate">{selectedSite.name}</span>
            </div>
            <button
              onClick={() => setInternalSelectedSiteId(null)}
              className="text-white/50 hover:text-white p-0.5 rounded cursor-pointer"
              aria-label="Close site inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-white/70">
              <span>Status:</span>
              <span className={selectedSite.status === 'APPROVED' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {selectedSite.status}
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Distance & Ring:</span>
              <span className="text-white">{selectedSite.distance_km} km ({selectedSite.ring})</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Slope & Safety:</span>
              <span className={selectedSite.slope_deg > 14 || selectedSite.slope_deg < 2 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {selectedSite.slope_deg}°
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Sphere Capacity:</span>
              <span className="text-cyan-300 font-bold">{selectedSite.sphere_capacity_persons} evacuees</span>
            </div>
            {selectedSite.veto_reasons && (
              <div className="mt-1.5 pt-1.5 border-t border-red-500/20 text-red-300 text-[10px]">
                ⚠️ VETO: {selectedSite.veto_reasons.join(', ')}
              </div>
            )}
            {selectedSite.status === 'APPROVED' && (
              <div className="mt-1.5 pt-1.5 border-t border-emerald-500/20 text-emerald-300 text-[10px]">
                ✓ Validated for {selectedSite.allocated_population} allocated evacuees.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Bottom-Right Legend Badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/90 backdrop-blur-md border border-white/15 px-3 py-2.5 rounded-lg pointer-events-none text-[11px] font-mono space-y-1.5 shadow-2xl hidden sm:block">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-white/90">Hazard Origin & AOI</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-white/90">Safe Sanctuary (Approved)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span className="text-white/90">Hard Veto (Disqualified)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-b border-dashed border-cyan-400" />
          <span className="text-white/60">5km / 10km Search Rings</span>
        </div>
      </div>
    </div>
  );
};
