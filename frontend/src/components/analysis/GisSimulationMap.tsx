import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DisasterScenario } from '../../data/syntheticScenarios';

interface GisSimulationMapProps {
  scenario: DisasterScenario;
  selectedSiteId?: string;
  onSelectSite?: (siteId: string) => void;
}

export const GisSimulationMap: React.FC<GisSimulationMapProps> = ({
  scenario,
  selectedSiteId,
  onSelectSite
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'streets'>('satellite');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [scenario.centroid.lat, scenario.centroid.lon],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      // High-resolution Earth Observation satellite basemap (ESRI World Imagery - Free & No API key needed)
      const baseTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'ESRI World Imagery'
      }).addTo(map);

      baseLayerRef.current = baseTile;
      layersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size after modal transition completes
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
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

    const newLayer = mapMode === 'satellite'
      ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'ESRI World Imagery'
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: 'OpenStreetMap'
        });

    newLayer.addTo(map);
    baseLayerRef.current = newLayer;

    // Send tile layer to back so vector layers stay on top
    newLayer.bringToBack();
  }, [mapMode]);

  // Update layers and center whenever scenario or selected site changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const { lat, lon } = scenario.centroid;
    map.setView([lat, lon], 12, { animate: true });
    map.invalidateSize();

    // 1. Progressive Search Rings (5km, 10km, 15km)
    L.circle([lat, lon], {
      radius: 5000,
      color: '#00E5FF',
      weight: 1.5,
      dashArray: '4, 6',
      fillColor: '#00E5FF',
      fillOpacity: 0.04
    }).bindTooltip('Ring 1 (0–5 km)', { permanent: false, direction: 'top' }).addTo(group);

    L.circle([lat, lon], {
      radius: 10000,
      color: '#84FFFF',
      weight: 1,
      dashArray: '3, 6',
      fillColor: '#84FFFF',
      fillOpacity: 0.02
    }).bindTooltip('Ring 2 (5–10 km)', { permanent: false, direction: 'top' }).addTo(group);

    // 2. Dynamic AOI Hazard Polygon / Ellipse
    L.circle([lat, lon], {
      radius: 2800,
      color: '#FF5A36',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#FF5A36',
      fillOpacity: 0.18
    }).bindTooltip(`Dynamic AOI Hazard Envelope: ${scenario.hazard_type}`, { permanent: false }).addTo(group);

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
        <div style="color: #111; font-family: sans-serif; padding: 4px;">
          <h4 style="margin: 0; font-weight: bold; color: #d32f2f;">${scenario.name}</h4>
          <p style="margin: 4px 0 0; font-size: 11px;">Hazard: <strong>${scenario.hazard_type}</strong></p>
          <p style="margin: 2px 0 0; font-size: 11px;">Displaced Pop: <strong>${scenario.displaced_population.toLocaleString()}</strong></p>
        </div>
      `)
      .addTo(group);

    // 4. Candidate Sanctuaries
    scenario.candidate_sanctuaries.forEach((site) => {
      const isApproved = site.status === 'APPROVED';
      const isSelected = site.id === selectedSiteId;

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

      // Connect polyline corridor from centroid
      L.polyline([[lat, lon], [site.lat, site.lon]], {
        color: isApproved ? '#00E5FF' : '#FF5A36',
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 0.9 : 0.45,
        dashArray: isApproved ? '5, 5' : '2, 6'
      }).addTo(group);

      const popupHtml = `
        <div style="color: #111; font-family: sans-serif; min-width: 180px; padding: 4px;">
          <h4 style="margin: 0; font-weight: bold; color: ${isApproved ? '#00838f' : '#c62828'};">${site.name}</h4>
          <p style="margin: 4px 0 2px; font-size: 11px;">Status: <strong>${site.status}</strong></p>
          <p style="margin: 2px 0 2px; font-size: 11px;">Distance: <strong>${site.distance_km} km</strong></p>
          <p style="margin: 2px 0 2px; font-size: 11px;">Capacity: <strong>${site.sphere_capacity_persons} persons</strong></p>
          ${!isApproved && site.veto_reasons ? `<p style="margin: 4px 0 0; font-size: 10px; color: #b71c1c;">Veto: ${site.veto_reasons.join(', ')}</p>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onSelectSite) onSelectSite(site.id);
      });
    });

  }, [scenario, selectedSiteId]);

  return (
    <div className="relative w-full h-[450px] lg:h-[520px] rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Floating Tactical Map Overlay HUD */}
      <div className="absolute top-4 left-4 z-10 bg-black/85 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-lg pointer-events-none text-xs font-mono space-y-1">
        <div className="flex items-center gap-2 text-raksha-accent font-semibold tracking-wider">
          <span className="w-2 h-2 rounded-full bg-raksha-accent animate-ping" />
          <span>REAL-TIME GIS TACTICAL OVERVIEW</span>
        </div>
        <div className="text-white/80">{scenario.name}</div>
        <div className="text-white/60">AOI Bearing: {scenario.hazard_summary.flow_vector.bearing_deg}° | Speed: {scenario.hazard_summary.flow_vector.speed_mps} m/s</div>
      </div>

      {/* Map Mode Switcher (Satellite vs Streets) */}
      <div className="absolute top-4 right-4 z-10 flex items-center bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-1 font-mono text-xs shadow-xl">
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

      {/* Legend Badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/90 backdrop-blur-md border border-white/15 px-3 py-2 rounded-lg pointer-events-none text-[11px] font-mono space-y-1">
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
          <span className="text-white/90">Hard Veto (Rejected)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-b border-dashed border-cyan-400" />
          <span className="text-white/60">5km / 10km Search Rings</span>
        </div>
      </div>
    </div>
  );
};
