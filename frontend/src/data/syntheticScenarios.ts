export interface CandidateSanctuary {
  id: string;
  name: string;
  ring: '0-5 km' | '5-10 km' | '10-15 km' | '15-20 km' | '20-25 km' | string;
  lat: number;
  lon: number;
  distance_km: number;
  gross_area_sqm: number;
  usable_area_sqm: number;
  sphere_capacity_persons: number;
  allocated_population: number;
  slope_deg: number;
  status: 'APPROVED' | 'HARD_VETO' | string;
  in_active_radius?: boolean;
  veto_reasons?: string[];
  mcda_score: number;
  infrastructure: {
    water_tanks: number;
    power_backup: string;
    medical_distance_km: number;
    helipad: boolean;
  };
}

export interface DisasterScenario {
  id: string;
  name: string;
  state: string;
  centroid: { lat: number; lon: number };
  hazard_type: string;
  displaced_population: number;
  planning_window_mins: number;
  primary_route_name: string;
  hazard_summary: {
    severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
    rainfall_24h_mm: number;
    cloudburst_intensity: string;
    soil_saturation_pct: number;
    computed_hazard_index: number;
    flow_vector: { bearing_deg: number; speed_mps: number };
  };
  satellite_telemetry: {
    sentinel1_sar: {
      orbit: number;
      pass: 'DESCENDING' | 'ASCENDING';
      mode: string;
      polarization: string;
      gamma0_backscatter_db: number;
      specular_anomaly: boolean;
      scene_id: string;
      timestamp: string;
    };
    sentinel2_optical: {
      tile: string;
      cloud_coverage_pct: number;
      resolution_m: number;
      ndwi_water_index: number;
      ndvi_vegetation: number;
      scene_id: string;
    };
    cartosat3_highres: {
      gsd_pan_m: number;
      gsd_ms_m: number;
      structural_footprint_density_pct: number;
      unblocked_open_ground_sqm: number;
      helipad_clearance_45m: string;
      sensor: string;
    };
    isro_bhuvan: {
      lulc_classification: string;
      historical_disaster_tier: string;
      drainage_buffer_m: number;
    };
    worldpop: {
      grid_resolution: string;
      estimated_aoi_exposure: number;
      vulnerable_demographics: { infants_pct: number; elderly_pct: number; mobility_impaired: number };
    };
  };
  srtm_transect: {
    points: { dist_km: number; elevation_m: number; slope_pct: number; label: string }[];
    min_elevation_m: number;
    max_elevation_m: number;
    max_gradient_pct: number;
  };
  candidate_sanctuaries: CandidateSanctuary[];
  fleet_logistics: {
    total_evacuees: number;
    default_fleet_size: number;
    default_bus_capacity: number;
    speed_kmh: number;
    turnaround_time_mins: number;
    total_cycles_needed: number;
    evacuation_clearance_mins: number;
    fuel_liters: number;
  };
  ddma_directive: {
    order_no: string;
    incident_commander: string;
    legal_act: string;
    executive_summary: string;
    authorized_actions: string[];
  };
}

export const SYNTHETIC_SCENARIOS: Record<string, DisasterScenario> = {
  devgram: {
    id: 'devgram',
    name: 'Devgram Hazard Habitation (Chamoli, Uttarakhand)',
    state: 'Uttarakhand',
    centroid: { lat: 30.3207, lon: 79.2163 },
    hazard_type: 'Glacial Inundation & Landslide Runoff',
    displaced_population: 720,
    planning_window_mins: 180,
    primary_route_name: 'Urgam-Helang Road ➔ NH-58 Badrinath Corridor',
    hazard_summary: {
      severity: 'CRITICAL',
      rainfall_24h_mm: 268.4,
      cloudburst_intensity: 'Torrential (94 mm/hr)',
      soil_saturation_pct: 96.2,
      computed_hazard_index: 0.91,
      flow_vector: { bearing_deg: 142, speed_mps: 5.4 }
    },
    satellite_telemetry: {
      sentinel1_sar: {
        orbit: 122,
        pass: 'DESCENDING',
        mode: 'IW (Interferometric Wide)',
        polarization: 'VV + VH',
        gamma0_backscatter_db: -18.7,
        specular_anomaly: true,
        scene_id: 'S1A_IW_GRDH_1SDV_20261019T004212_UTK_CHAMOLI',
        timestamp: '2026-10-19T00:42:12 UTC'
      },
      sentinel2_optical: {
        tile: '44RML',
        cloud_coverage_pct: 12.3,
        resolution_m: 10,
        ndwi_water_index: 0.68,
        ndvi_vegetation: 0.38,
        scene_id: 'S2B_MSIL2A_20261018T051839_CHAMOLI_VALLEY'
      },
      cartosat3_highres: {
        gsd_pan_m: 0.28,
        gsd_ms_m: 1.12,
        structural_footprint_density_pct: 11.4,
        unblocked_open_ground_sqm: 16800,
        helipad_clearance_45m: 'PASSED (65m unobstructed approach fan)',
        sensor: 'Cartosat-3 PAN + 4-Band MX'
      },
      isro_bhuvan: {
        lulc_classification: 'Institutional Open Grounds & Stable Moraine Terrace',
        historical_disaster_tier: 'Low (Zero debris deposits documented in 50y record)',
        drainage_buffer_m: 640
      },
      worldpop: {
        grid_resolution: '100m Gridded Density (CC BY 4.0)',
        estimated_aoi_exposure: 745,
        vulnerable_demographics: { infants_pct: 8.4, elderly_pct: 16.2, mobility_impaired: 34 }
      }
    },
    srtm_transect: {
      points: [
        { dist_km: 0.0, elevation_m: 1840, slope_pct: 12.4, label: 'Devgram Epicenter' },
        { dist_km: 1.2, elevation_m: 1760, slope_pct: 9.8, label: 'Urgam River Bridge' },
        { dist_km: 2.5, elevation_m: 1680, slope_pct: 7.2, label: 'Valley Choke Point' },
        { dist_km: 3.8, elevation_m: 1590, slope_pct: 6.5, label: 'Helang Junction' },
        { dist_km: 5.3, elevation_m: 1470, slope_pct: 4.1, label: 'Pipalkoti Sanctuary' }
      ],
      min_elevation_m: 1470,
      max_elevation_m: 1840,
      max_gradient_pct: 12.4
    },
    candidate_sanctuaries: [
      {
        id: 'dev-site-veto',
        name: 'Urgam Floodplain Terraces (Proposed Camp Beta)',
        ring: '0-5 km',
        lat: 30.3340,
        lon: 79.2290,
        distance_km: 1.91,
        gross_area_sqm: 18000,
        usable_area_sqm: 10800,
        sphere_capacity_persons: 240,
        allocated_population: 0,
        slope_deg: 19.5,
        status: 'HARD_VETO',
        veto_reasons: ['Debris flow runout path (< 180m)', 'Slope gradient 19.5° exceeds 14° safe ceiling', 'SAR Backscatter Specular Alert'],
        mcda_score: 18.2,
        infrastructure: { water_tanks: 0, power_backup: 'None', medical_distance_km: 7.5, helipad: false }
      },
      {
        id: 'dev-site-r1',
        name: 'Urgam Upper Ridge Forest Rest Post',
        ring: '0-5 km',
        lat: 30.3420,
        lon: 79.2410,
        distance_km: 3.35,
        gross_area_sqm: 18000,
        usable_area_sqm: 10800,
        sphere_capacity_persons: 240,
        allocated_population: 240,
        slope_deg: 8.2,
        status: 'APPROVED',
        mcda_score: 86.4,
        infrastructure: { water_tanks: 6, power_backup: '40 kVA Solar-DG', medical_distance_km: 3.2, helipad: false }
      },
      {
        id: 'dev-site-1',
        name: 'Pipalkoti Institutional Complex & Relief Grounds',
        ring: '5-10 km',
        lat: 30.3540,
        lon: 79.2560,
        distance_km: 5.27,
        gross_area_sqm: 36000,
        usable_area_sqm: 21600,
        sphere_capacity_persons: 480,
        allocated_population: 480,
        slope_deg: 3.8,
        status: 'APPROVED',
        mcda_score: 94.6,
        infrastructure: { water_tanks: 12, power_backup: '125 kVA Hybrid Solar-DG', medical_distance_km: 1.2, helipad: true }
      },
      {
        id: 'dev-site-2',
        name: 'Helang Community Campus & Higher Secondary School',
        ring: '5-10 km',
        lat: 30.3680,
        lon: 79.2780,
        distance_km: 7.87,
        gross_area_sqm: 24000,
        usable_area_sqm: 14400,
        sphere_capacity_persons: 320,
        allocated_population: 0,
        slope_deg: 5.1,
        status: 'APPROVED',
        mcda_score: 89.2,
        infrastructure: { water_tanks: 8, power_backup: '65 kVA DG', medical_distance_km: 2.4, helipad: true }
      },
      {
        id: 'dev-site-3',
        name: 'Government Inter College (GIC) Joshimath Corridor Ground',
        ring: '10-15 km',
        lat: 30.3850,
        lon: 79.2990,
        distance_km: 10.61,
        gross_area_sqm: 18750,
        usable_area_sqm: 11250,
        sphere_capacity_persons: 250,
        allocated_population: 0,
        slope_deg: 6.2,
        status: 'APPROVED',
        mcda_score: 82.5,
        infrastructure: { water_tanks: 6, power_backup: '50 kVA DG', medical_distance_km: 4.5, helipad: false }
      },
      {
        id: 'dev-site-4',
        name: 'Agriculture & Horticulture Research Station, Marwari',
        ring: '10-15 km',
        lat: 30.4010,
        lon: 79.3150,
        distance_km: 12.92,
        gross_area_sqm: 22500,
        usable_area_sqm: 13500,
        sphere_capacity_persons: 300,
        allocated_population: 0,
        slope_deg: 7.1,
        status: 'APPROVED',
        mcda_score: 79.8,
        infrastructure: { water_tanks: 8, power_backup: '65 kVA DG', medical_distance_km: 5.8, helipad: true }
      },
      {
        id: 'dev-site-6',
        name: 'Joshimath Cantonment Highland Relief Grounds',
        ring: '15-20 km',
        lat: 30.4350,
        lon: 79.3450,
        distance_km: 17.51,
        gross_area_sqm: 37500,
        usable_area_sqm: 22500,
        sphere_capacity_persons: 500,
        allocated_population: 0,
        slope_deg: 4.5,
        status: 'APPROVED',
        mcda_score: 85.0,
        infrastructure: { water_tanks: 14, power_backup: '200 kVA Grid', medical_distance_km: 1.5, helipad: true }
      },
      {
        id: 'dev-site-7',
        name: 'Birahi Valley Elevated Multi-Agency Relief Center',
        ring: '20-25 km',
        lat: 30.4100,
        lon: 79.4100,
        distance_km: 21.05,
        gross_area_sqm: 45000,
        usable_area_sqm: 27000,
        sphere_capacity_persons: 600,
        allocated_population: 0,
        slope_deg: 5.0,
        status: 'APPROVED',
        mcda_score: 84.0,
        infrastructure: { water_tanks: 18, power_backup: '250 kVA Grid', medical_distance_km: 2.0, helipad: true }
      }
    ],
    fleet_logistics: {
      total_evacuees: 720,
      default_fleet_size: 14,
      default_bus_capacity: 55,
      speed_kmh: 28,
      turnaround_time_mins: 42,
      total_cycles_needed: 1,
      evacuation_clearance_mins: 110,
      fuel_liters: 140
    },
    ddma_directive: {
      order_no: 'DDMA/CHM/DIS-EVAC/2026/041',
      incident_commander: 'Shri Himanshu Khurana, IAS (District Magistrate / DDMA Chairman)',
      legal_act: 'Disaster Management Act, 2005 (Sections 30, 33 & 34)',
      executive_summary: 'Immediate mandatory evacuation directive for Devgram settlement to Pipalkoti & Helang validated sanctuaries due to glacial lake surge alerts.',
      authorized_actions: [
        'Deployment of 14 high-ground clearance Uttarakhand Transport buses with NDRF escorts.',
        'Immediate establishment of Sphere-compliant medical triaging at Pipalkoti Institutional Complex.',
        'Strict enforceability of safety veto perimeter around Urgam floodplain.'
      ]
    }
  },

  wayanad: {
    id: 'wayanad',
    name: 'Wayanad Landslide Core (Meppadi/Chooralmala, Kerala)',
    state: 'Kerala',
    centroid: { lat: 11.5126, lon: 76.1287 },
    hazard_type: 'Landslide Runoff & Torrential Debris Flow',
    displaced_population: 2450,
    planning_window_mins: 180,
    primary_route_name: 'SH-59 Meppadi-Chooralmala Hill Highway ➔ Kalpetta Arterial',
    hazard_summary: {
      severity: 'CRITICAL',
      rainfall_24h_mm: 372.0,
      cloudburst_intensity: 'Extreme Cloudburst (118 mm/hr)',
      soil_saturation_pct: 99.4,
      computed_hazard_index: 0.96,
      flow_vector: { bearing_deg: 215, speed_mps: 8.2 }
    },
    satellite_telemetry: {
      sentinel1_sar: {
        orbit: 85,
        pass: 'ASCENDING',
        mode: 'IW (Interferometric Wide)',
        polarization: 'VV + VH',
        gamma0_backscatter_db: -21.4,
        specular_anomaly: true,
        scene_id: 'S1B_IW_GRDH_1SDV_20261019T121045_WYN_MEPPADI',
        timestamp: '2026-10-19T12:10:45 UTC'
      },
      sentinel2_optical: {
        tile: '43PGQ',
        cloud_coverage_pct: 28.5,
        resolution_m: 10,
        ndwi_water_index: 0.74,
        ndvi_vegetation: 0.52,
        scene_id: 'S2A_MSIL2A_20261017T050641_WAYANAD_WESTERN_GHATS'
      },
      cartosat3_highres: {
        gsd_pan_m: 0.28,
        gsd_ms_m: 1.12,
        structural_footprint_density_pct: 8.6,
        unblocked_open_ground_sqm: 42000,
        helipad_clearance_45m: 'PASSED (Dual twin-engine military helipad clear)',
        sensor: 'Cartosat-3 High Resolution Panchromatic'
      },
      isro_bhuvan: {
        lulc_classification: 'Tea Plantation Highlands & Consolidated Lateritic Plateau',
        historical_disaster_tier: 'Class-I Safe Ridge (Zero slope movements)',
        drainage_buffer_m: 1250
      },
      worldpop: {
        grid_resolution: '100m Gridded Density (CC BY 4.0)',
        estimated_aoi_exposure: 2490,
        vulnerable_demographics: { infants_pct: 9.1, elderly_pct: 18.5, mobility_impaired: 72 }
      }
    },
    srtm_transect: {
      points: [
        { dist_km: 0.0, elevation_m: 980, slope_pct: 18.2, label: 'Chooralmala Epicenter' },
        { dist_km: 2.1, elevation_m: 890, slope_pct: 14.5, label: 'Vellarmala Bridge Cut' },
        { dist_km: 4.3, elevation_m: 820, slope_pct: 8.1, label: 'Meppadi Town Center' },
        { dist_km: 6.6, elevation_m: 780, slope_pct: 4.2, label: 'Kalpetta Ridge Sanctuary' }
      ],
      min_elevation_m: 780,
      max_elevation_m: 980,
      max_gradient_pct: 18.2
    },
    candidate_sanctuaries: [
      {
        id: 'wyn-site-1',
        name: 'Kalpetta SKMJ Higher Secondary & District Stadium Grounds',
        ring: '5-10 km',
        lat: 11.6074,
        lon: 76.0825,
        distance_km: 11.2,
        gross_area_sqm: 65000,
        usable_area_sqm: 39000,
        sphere_capacity_persons: 1600,
        allocated_population: 1550,
        slope_deg: 2.9,
        status: 'APPROVED',
        mcda_score: 96.8,
        infrastructure: { water_tanks: 24, power_backup: '250 kVA Dedicated Substation Grid', medical_distance_km: 0.8, helipad: true }
      },
      {
        id: 'wyn-site-2',
        name: 'Meppadi Poly-Campus & Community Health Ground',
        ring: '0-5 km',
        lat: 11.5521,
        lon: 76.1214,
        distance_km: 4.65,
        gross_area_sqm: 38000,
        usable_area_sqm: 22800,
        sphere_capacity_persons: 950,
        allocated_population: 900,
        slope_deg: 4.3,
        status: 'APPROVED',
        mcda_score: 91.4,
        infrastructure: { water_tanks: 16, power_backup: '100 kVA DG', medical_distance_km: 0.3, helipad: true }
      },
      {
        id: 'wyn-site-veto',
        name: 'Mundakkai Valley Lowlands (Tea Factory Ground)',
        ring: '0-5 km',
        lat: 11.5210,
        lon: 76.1420,
        distance_km: 1.80,
        gross_area_sqm: 21000,
        usable_area_sqm: 12600,
        sphere_capacity_persons: 280,
        allocated_population: 0,
        slope_deg: 24.2,
        status: 'HARD_VETO',
        veto_reasons: ['Direct debris path of Iruvanjippuzha feeder', 'Slope 24.2° severe destabilization risk', 'Bridge access washed out'],
        mcda_score: 11.0,
        infrastructure: { water_tanks: 0, power_backup: 'None', medical_distance_km: 12.0, helipad: false }
      }
    ],
    fleet_logistics: {
      total_evacuees: 2450,
      default_fleet_size: 32,
      default_bus_capacity: 50,
      speed_kmh: 30,
      turnaround_time_mins: 55,
      total_cycles_needed: 2,
      evacuation_clearance_mins: 145,
      fuel_liters: 420
    },
    ddma_directive: {
      order_no: 'DDMA/WYN/EMRG/2026/89',
      incident_commander: 'Smt. D. R. Meghashree, IAS (District Collector & Chairperson DDMA)',
      legal_act: 'Kerala State Disaster Management Act / DM Act 2005 (Sec 30)',
      executive_summary: 'Total red-alert evacuation of Chooralmala-Mundakkai sector following torrential cloudburst triggering slope liquefied debris flow.',
      authorized_actions: [
        'Mobilization of 32 KSRTC super-fast buses and 12 Indian Army ALH Dhruv helicopter sorties.',
        'Zero human presence within 800m of river channel.',
        'Continuous SAR radar backscatter monitoring at 6-hour orbital pass cycles.'
      ]
    }
  },

  silchar: {
    id: 'silchar',
    name: 'Silchar Flood Plain / Barak Valley (Cachar, Assam)',
    state: 'Assam',
    centroid: { lat: 24.8333, lon: 92.7789 },
    hazard_type: 'Riverine Inundation & Embankment Breach',
    displaced_population: 14800,
    planning_window_mins: 300,
    primary_route_name: 'Silchar-Hailakandi Elevated Corridor / NH-37 Bypass',
    hazard_summary: {
      severity: 'CRITICAL',
      rainfall_24h_mm: 310.5,
      cloudburst_intensity: 'Continuous Heavy Monsoon (62 mm/hr)',
      soil_saturation_pct: 100.0,
      computed_hazard_index: 0.94,
      flow_vector: { bearing_deg: 95, speed_mps: 3.2 }
    },
    satellite_telemetry: {
      sentinel1_sar: {
        orbit: 41,
        pass: 'DESCENDING',
        mode: 'IW (Interferometric Wide)',
        polarization: 'VV + VH',
        gamma0_backscatter_db: -23.1,
        specular_anomaly: true,
        scene_id: 'S1A_IW_GRDH_1SDV_20261019T230812_ASM_SILCHAR',
        timestamp: '2026-10-19T23:08:12 UTC'
      },
      sentinel2_optical: {
        tile: '46RGN',
        cloud_coverage_pct: 44.0,
        resolution_m: 10,
        ndwi_water_index: 0.82,
        ndvi_vegetation: 0.28,
        scene_id: 'S2B_MSIL2A_20261016T044021_BARAK_VALLEY'
      },
      cartosat3_highres: {
        gsd_pan_m: 0.28,
        gsd_ms_m: 1.12,
        structural_footprint_density_pct: 14.8,
        unblocked_open_ground_sqm: 110000,
        helipad_clearance_45m: 'PASSED (Four heavy-lift Chinook coordinates certified)',
        sensor: 'Cartosat-3 Sub-Meter Panchromatic'
      },
      isro_bhuvan: {
        lulc_classification: 'Elevated Alluvial Terrace & Institutional University Enclave',
        historical_disaster_tier: 'Zero 100-Year Flood Inundation Height (+14m relative to Barak High Flood Level)',
        drainage_buffer_m: 1800
      },
      worldpop: {
        grid_resolution: '100m Gridded Density (CC BY 4.0)',
        estimated_aoi_exposure: 15200,
        vulnerable_demographics: { infants_pct: 11.2, elderly_pct: 14.8, mobility_impaired: 310 }
      }
    },
    srtm_transect: {
      points: [
        { dist_km: 0.0, elevation_m: 21, slope_pct: 0.8, label: 'Bethukandi Breach Point' },
        { dist_km: 3.1, elevation_m: 23, slope_pct: 0.4, label: 'Rangirkhari Submerged Sector' },
        { dist_km: 6.8, elevation_m: 28, slope_pct: 1.2, label: 'Tarapur Railway Embankment' },
        { dist_km: 10.2, elevation_m: 39, slope_pct: 2.8, label: 'NIT Silchar Elevated Campus' }
      ],
      min_elevation_m: 21,
      max_elevation_m: 39,
      max_gradient_pct: 2.8
    },
    candidate_sanctuaries: [
      {
        id: 'sil-site-1',
        name: 'National Institute of Technology (NIT) Silchar Campus',
        ring: '5-10 km',
        lat: 24.7577,
        lon: 92.7925,
        distance_km: 9.45,
        gross_area_sqm: 240000,
        usable_area_sqm: 144000,
        sphere_capacity_persons: 9200,
        allocated_population: 9000,
        slope_deg: 2.1,
        status: 'APPROVED',
        mcda_score: 98.4,
        infrastructure: { water_tanks: 60, power_backup: '1 MVA High Voltage Substation', medical_distance_km: 0.5, helipad: true }
      },
      {
        id: 'sil-site-2',
        name: 'Assam University Dargakona Campus Grounds',
        ring: '10-15 km',
        lat: 24.6852,
        lon: 92.7508,
        distance_km: 16.8,
        gross_area_sqm: 180000,
        usable_area_sqm: 108000,
        sphere_capacity_persons: 6200,
        allocated_population: 5800,
        slope_deg: 3.4,
        status: 'APPROVED',
        mcda_score: 93.2,
        infrastructure: { water_tanks: 45, power_backup: '500 kVA DG', medical_distance_km: 1.1, helipad: true }
      },
      {
        id: 'sil-site-veto',
        name: 'Silchar Sadar Lowlands (Gandhi Mela Complex)',
        ring: '0-5 km',
        lat: 24.8210,
        lon: 92.7950,
        distance_km: 2.40,
        gross_area_sqm: 45000,
        usable_area_sqm: 27000,
        sphere_capacity_persons: 1200,
        allocated_population: 0,
        slope_deg: 0.3,
        status: 'HARD_VETO',
        veto_reasons: ['Inundation depth 2.8m water logging', 'Backflow from Sonai tributary', 'Contaminated water supply'],
        mcda_score: 14.5,
        infrastructure: { water_tanks: 0, power_backup: 'Submerged', medical_distance_km: 4.8, helipad: false }
      }
    ],
    fleet_logistics: {
      total_evacuees: 14800,
      default_fleet_size: 85,
      default_bus_capacity: 60,
      speed_kmh: 25,
      turnaround_time_mins: 70,
      total_cycles_needed: 3,
      evacuation_clearance_mins: 240,
      fuel_liters: 1650
    },
    ddma_directive: {
      order_no: 'DDMA/CACHAR/BARAK-EVAC/2026/112',
      incident_commander: 'Shri Rohan Kumar Jha, IAS (Deputy Commissioner, Cachar)',
      legal_act: 'Disaster Management Act 2005 (Sections 34 & 65)',
      executive_summary: 'Mass evacuation directive for Silchar municipal area following Bethukandi dyke breach into Mahisha Beel and urban core.',
      authorized_actions: [
        'Requisitioning of 85 ASTC and commercial multi-axle carrier units.',
        'Immediate staging of water-rescue SDRF/NDRF motorboats for high-ground transfer.',
        'Zero camp placement inside low-lying river plains.'
      ]
    }
  },

  chamoli: {
    id: 'chamoli',
    name: 'Joshimath Subsidence Zone (Uttarakhand)',
    state: 'Uttarakhand',
    centroid: { lat: 30.5574, lon: 79.5670 },
    hazard_type: 'Land Subsidence & Slope Destabilization',
    displaced_population: 2800,
    planning_window_mins: 240,
    primary_route_name: 'NH-07 Joshimath-Rishikesh National Highway',
    hazard_summary: {
      severity: 'HIGH',
      rainfall_24h_mm: 142.0,
      cloudburst_intensity: 'Moderate Continuous (34 mm/hr)',
      soil_saturation_pct: 84.5,
      computed_hazard_index: 0.83,
      flow_vector: { bearing_deg: 180, speed_mps: 2.1 }
    },
    satellite_telemetry: {
      sentinel1_sar: {
        orbit: 78,
        pass: 'ASCENDING',
        mode: 'InSAR PS (Persistent Scatterer)',
        polarization: 'VV',
        gamma0_backscatter_db: -14.2,
        specular_anomaly: false,
        scene_id: 'S1A_IW_SLC__1SDV_20261018T011402_JOSHIMATH_INSAR',
        timestamp: '2026-10-18T01:14:02 UTC'
      },
      sentinel2_optical: {
        tile: '44RML',
        cloud_coverage_pct: 8.9,
        resolution_m: 10,
        ndwi_water_index: 0.22,
        ndvi_vegetation: 0.44,
        scene_id: 'S2B_MSIL2A_20261015T051219_JOSHIMATH'
      },
      cartosat3_highres: {
        gsd_pan_m: 0.28,
        gsd_ms_m: 1.12,
        structural_footprint_density_pct: 9.8,
        unblocked_open_ground_sqm: 48000,
        helipad_clearance_45m: 'PASSED (Helipad active at Pipalkoti cantonment)',
        sensor: 'Cartosat-3 PAN + MX'
      },
      isro_bhuvan: {
        lulc_classification: 'Bedrock Granite Outcrop & Stable Fluvial Terrace',
        historical_disaster_tier: 'Class-I Geotechnical Bedrock',
        drainage_buffer_m: 1100
      },
      worldpop: {
        grid_resolution: '100m Gridded Density (CC BY 4.0)',
        estimated_aoi_exposure: 2820,
        vulnerable_demographics: { infants_pct: 6.8, elderly_pct: 17.4, mobility_impaired: 62 }
      }
    },
    srtm_transect: {
      points: [
        { dist_km: 0.0, elevation_m: 1890, slope_pct: 14.1, label: 'Sunil / Manohar Bagh Fissures' },
        { dist_km: 4.2, elevation_m: 1710, slope_pct: 9.2, label: 'Auli Junction Switchback' },
        { dist_km: 11.5, elevation_m: 1520, slope_pct: 5.4, label: 'Helang Transit Ground' },
        { dist_km: 18.0, elevation_m: 1380, slope_pct: 3.1, label: 'Pipalkoti Permanent Camp' }
      ],
      min_elevation_m: 1380,
      max_elevation_m: 1890,
      max_gradient_pct: 14.1
    },
    candidate_sanctuaries: [
      {
        id: 'chm-site-1',
        name: 'Pipalkoti Solid Bedrock Government Campus',
        ring: '10-15 km',
        lat: 30.4285,
        lon: 79.4312,
        distance_km: 18.2,
        gross_area_sqm: 72000,
        usable_area_sqm: 43200,
        sphere_capacity_persons: 1900,
        allocated_population: 1800,
        slope_deg: 3.2,
        status: 'APPROVED',
        mcda_score: 95.1,
        infrastructure: { water_tanks: 28, power_backup: '160 kVA DG', medical_distance_km: 1.5, helipad: true }
      },
      {
        id: 'chm-site-2',
        name: 'Gauchar Airstrip Environs & Ground',
        ring: '10-15 km',
        lat: 30.2921,
        lon: 79.1542,
        distance_km: 26.4,
        gross_area_sqm: 90000,
        usable_area_sqm: 54000,
        sphere_capacity_persons: 2100,
        allocated_population: 1000,
        slope_deg: 1.8,
        status: 'APPROVED',
        mcda_score: 93.8,
        infrastructure: { water_tanks: 35, power_backup: 'Airstrip Grid Substation', medical_distance_km: 0.4, helipad: true }
      },
      {
        id: 'chm-site-veto',
        name: 'Marwari Slopes (Near Alaknanda Riverbed)',
        ring: '0-5 km',
        lat: 30.5480,
        lon: 79.5610,
        distance_km: 2.10,
        gross_area_sqm: 22000,
        usable_area_sqm: 13200,
        sphere_capacity_persons: 350,
        allocated_population: 0,
        slope_deg: 26.8,
        status: 'HARD_VETO',
        veto_reasons: ['Severe toe erosion by Alaknanda river', 'Active structural shear displacement > 4cm/wk', 'Slope 26.8° critically unstable'],
        mcda_score: 8.5,
        infrastructure: { water_tanks: 0, power_backup: 'None', medical_distance_km: 8.2, helipad: false }
      }
    ],
    fleet_logistics: {
      total_evacuees: 2800,
      default_fleet_size: 26,
      default_bus_capacity: 45,
      speed_kmh: 32,
      turnaround_time_mins: 65,
      total_cycles_needed: 2,
      evacuation_clearance_mins: 170,
      fuel_liters: 580
    },
    ddma_directive: {
      order_no: 'DDMA/CHM/SUB-RELOC/2026/019',
      incident_commander: 'District Magistrate, Chamoli (Chairperson DDMA)',
      legal_act: 'National Disaster Management Act, 2005 (Sec 30)',
      executive_summary: 'Preemptive structural decompression and permanent relocation order for residents in Sunil, Manohar Bagh, and Singdhar wards.',
      authorized_actions: [
        'Organized phased convoy transit to Pipalkoti and Gauchar pre-fabricated townships.',
        'Immediate sealing of sinkholes and active shear zones to prevent public entry.'
      ]
    }
  },

  munambam: {
    id: 'munambam',
    name: 'Munambam Coastal Erosion & Storm Surge (Ernakulam, Kerala)',
    state: 'Kerala',
    centroid: { lat: 10.1792, lon: 76.1738 },
    hazard_type: 'Coastal Storm Surge & Sea Ingress',
    displaced_population: 3500,
    planning_window_mins: 200,
    primary_route_name: 'Vypeen Coastal Highway ➔ Paravur Elevated Arterial',
    hazard_summary: {
      severity: 'HIGH',
      rainfall_24h_mm: 198.0,
      cloudburst_intensity: 'Heavy Tropical Squall (55 mm/hr)',
      soil_saturation_pct: 92.0,
      computed_hazard_index: 0.85,
      flow_vector: { bearing_deg: 85, speed_mps: 4.1 }
    },
    satellite_telemetry: {
      sentinel1_sar: {
        orbit: 14,
        pass: 'ASCENDING',
        mode: 'IW (Interferometric Wide)',
        polarization: 'VV + VH',
        gamma0_backscatter_db: -19.2,
        specular_anomaly: true,
        scene_id: 'S1B_IW_GRDH_1SDV_20261018T181219_COASTAL_KRL',
        timestamp: '2026-10-18T18:12:19 UTC'
      },
      sentinel2_optical: {
        tile: '43PFO',
        cloud_coverage_pct: 18.2,
        resolution_m: 10,
        ndwi_water_index: 0.78,
        ndvi_vegetation: 0.35,
        scene_id: 'S2A_MSIL2A_20261017T051142_ERNAKULAM_COAST'
      },
      cartosat3_highres: {
        gsd_pan_m: 0.28,
        gsd_ms_m: 1.12,
        structural_footprint_density_pct: 12.0,
        unblocked_open_ground_sqm: 54000,
        helipad_clearance_45m: 'PASSED (Coastal Guard certified landing ground)',
        sensor: 'Cartosat-3 PAN + Multi-Spectral'
      },
      isro_bhuvan: {
        lulc_classification: 'Inland Elevated Lateritic Plain & Higher Secondary School Campus',
        historical_disaster_tier: 'Zero Tidal Inundation Zone (+8m MSL)',
        drainage_buffer_m: 2100
      },
      worldpop: {
        grid_resolution: '100m Gridded Density (CC BY 4.0)',
        estimated_aoi_exposure: 3560,
        vulnerable_demographics: { infants_pct: 8.9, elderly_pct: 15.6, mobility_impaired: 85 }
      }
    },
    srtm_transect: {
      points: [
        { dist_km: 0.0, elevation_m: 1.2, slope_pct: 0.2, label: 'Munambam Spit Coastal Line' },
        { dist_km: 2.5, elevation_m: 2.1, slope_pct: 0.3, label: 'Cherai Sea Wall Sector' },
        { dist_km: 5.4, elevation_m: 4.8, slope_pct: 0.6, label: 'Goshree Bridge Approach' },
        { dist_km: 8.2, elevation_m: 9.5, slope_pct: 1.1, label: 'North Paravur Inland Campus' }
      ],
      min_elevation_m: 1.2,
      max_elevation_m: 9.5,
      max_gradient_pct: 1.1
    },
    candidate_sanctuaries: [
      {
        id: 'mun-site-1',
        name: 'North Paravur Government Higher Secondary & Municipal Stadium',
        ring: '5-10 km',
        lat: 10.1450,
        lon: 76.2290,
        distance_km: 8.2,
        gross_area_sqm: 85000,
        usable_area_sqm: 51000,
        sphere_capacity_persons: 2400,
        allocated_population: 2300,
        slope_deg: 1.2,
        status: 'APPROVED',
        mcda_score: 95.8,
        infrastructure: { water_tanks: 30, power_backup: '180 kVA DG', medical_distance_km: 0.6, helipad: true }
      },
      {
        id: 'mun-site-2',
        name: 'SNM Institute of Management & Technology Grounds',
        ring: '5-10 km',
        lat: 10.1620,
        lon: 76.2050,
        distance_km: 6.4,
        gross_area_sqm: 52000,
        usable_area_sqm: 31200,
        sphere_capacity_persons: 1350,
        allocated_population: 1200,
        slope_deg: 1.5,
        status: 'APPROVED',
        mcda_score: 92.4,
        infrastructure: { water_tanks: 18, power_backup: '100 kVA DG', medical_distance_km: 1.2, helipad: false }
      },
      {
        id: 'mun-site-veto',
        name: 'Cherai Beach Resort Lowland Ground',
        ring: '0-5 km',
        lat: 10.1510,
        lon: 76.1780,
        distance_km: 3.10,
        gross_area_sqm: 26000,
        usable_area_sqm: 15600,
        sphere_capacity_persons: 450,
        allocated_population: 0,
        slope_deg: 0.4,
        status: 'HARD_VETO',
        veto_reasons: ['Tidal surge overtopping sea wall', 'Saline water contamination of potable ground wells', 'Low elevation < 1.5m MSL'],
        mcda_score: 12.1,
        infrastructure: { water_tanks: 0, power_backup: 'Flooded', medical_distance_km: 6.0, helipad: false }
      }
    ],
    fleet_logistics: {
      total_evacuees: 3500,
      default_fleet_size: 38,
      default_bus_capacity: 55,
      speed_kmh: 35,
      turnaround_time_mins: 45,
      total_cycles_needed: 2,
      evacuation_clearance_mins: 150,
      fuel_liters: 490
    },
    ddma_directive: {
      order_no: 'DDMA/EKM/SURGE-EVAC/2026/088',
      incident_commander: 'District Collector & Chairman DDMA, Ernakulam',
      legal_act: 'Disaster Management Act 2005 / Coastal Zone Evacuation Protocol',
      executive_summary: 'Precautionary evacuation of vulnerable coastal fishing families from Munambam and Cherai sandbar barrier.',
      authorized_actions: [
        'Fleet mobilization of 38 state transit buses along Paravur elevated arterial.',
        'Immediate opening of North Paravur Municipal Camp with continuous drinking water supply tankers.'
      ]
    }
  }
};

export function createScenarioFromGlobalIncident(incident: {
  id: string;
  title: string;
  place: string;
  hazard_type: string;
  lat: number;
  lon: number;
  severity: number;
  alert_level: 'critical' | 'warning' | 'advisory' | 'moderate' | 'info';
  is_demo_preset?: boolean;
  default_population?: number;
}): DisasterScenario {
  const isCrit = incident.alert_level === 'critical';
  const defaultPop = incident.default_population && incident.default_population > 0 
    ? incident.default_population 
    : (incident.severity >= 6.0 ? 6800 : 3400);

  const placeLabel = incident.place.split(',')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Sector';

  // Dynamic progressive ring candidate generation
  const site1Cap = Math.max(1200, Math.round(defaultPop * 0.45));
  const site2Cap = Math.max(2800, Math.round(defaultPop * 0.65));
  const site3Cap = Math.max(1500, Math.round(defaultPop * 0.50));
  const site4Cap = Math.max(3200, Math.round(defaultPop * 0.60));

  const alloc1 = 0; // Vetoed
  const alloc2 = Math.min(defaultPop, site2Cap); // Primary approved
  const alloc3 = 0; // Vetoed
  const alloc4 = Math.max(0, defaultPop - alloc2); // Supplementary approved

  const candidateSanctuaries: CandidateSanctuary[] = [
    {
      id: `${incident.id}-site-1`,
      name: `${placeLabel} Northern Sector Relief Ground`,
      ring: '0-5 km',
      lat: Number((incident.lat + 0.022).toFixed(6)),
      lon: Number((incident.lon + 0.018).toFixed(6)),
      distance_km: 3.2,
      gross_area_sqm: Math.round(site1Cap * 55),
      usable_area_sqm: Math.round(site1Cap * 33),
      sphere_capacity_persons: site1Cap,
      allocated_population: alloc1,
      slope_deg: 16.8,
      status: 'HARD_VETO',
      veto_reasons: [
        'Terrain slope 16.8° exceeds 14° safe humanitarian threshold (high landslide/slope instability)',
        'Inside primary 5km seismic and secondary debris hazard boundary'
      ],
      mcda_score: 34.2,
      infrastructure: {
        water_tanks: 1,
        power_backup: 'None (Grid Dependent)',
        medical_distance_km: 4.8,
        helipad: false
      }
    },
    {
      id: `${incident.id}-site-2`,
      name: `${placeLabel} Regional Education Complex & High Grounds`,
      ring: '5-10 km',
      lat: Number((incident.lat - 0.042).toFixed(6)),
      lon: Number((incident.lon + 0.038).toFixed(6)),
      distance_km: 6.8,
      gross_area_sqm: Math.round(site2Cap * 75),
      usable_area_sqm: Math.round(site2Cap * 45),
      sphere_capacity_persons: site2Cap,
      allocated_population: alloc2,
      slope_deg: 4.6,
      status: 'APPROVED',
      mcda_score: 89.8,
      infrastructure: {
        water_tanks: 6,
        power_backup: 'Dual Diesel GenSet (72h capacity)',
        medical_distance_km: 1.8,
        helipad: true
      }
    },
    {
      id: `${incident.id}-site-3`,
      name: `${placeLabel} Valley Agricultural Hub & Lowland Parcel`,
      ring: '5-10 km',
      lat: Number((incident.lat - 0.032).toFixed(6)),
      lon: Number((incident.lon - 0.052).toFixed(6)),
      distance_km: 7.9,
      gross_area_sqm: Math.round(site3Cap * 60),
      usable_area_sqm: Math.round(site3Cap * 36),
      sphere_capacity_persons: site3Cap,
      allocated_population: alloc3,
      slope_deg: 1.2,
      status: 'HARD_VETO',
      veto_reasons: [
        'Located in active hydrological alluvial drainage depression (flood/debris surge risk)',
        'Deficient soil bearing capacity for heavy shelter superstructures'
      ],
      mcda_score: 28.5,
      infrastructure: {
        water_tanks: 0,
        power_backup: 'None',
        medical_distance_km: 6.2,
        helipad: false
      }
    },
    {
      id: `${incident.id}-site-4`,
      name: `${placeLabel} Municipal Sports Stadium & Elevated Sanctuary`,
      ring: '10-15 km',
      lat: Number((incident.lat + 0.078).toFixed(6)),
      lon: Number((incident.lon - 0.065).toFixed(6)),
      distance_km: 12.4,
      gross_area_sqm: Math.round(site4Cap * 80),
      usable_area_sqm: Math.round(site4Cap * 48),
      sphere_capacity_persons: site4Cap,
      allocated_population: alloc4,
      slope_deg: 5.8,
      status: 'APPROVED',
      mcda_score: 86.4,
      infrastructure: {
        water_tanks: 8,
        power_backup: 'Dedicated Municipal Substation + Solar Microgrid',
        medical_distance_km: 2.4,
        helipad: true
      }
    }
  ];

  return {
    id: incident.id,
    name: incident.title,
    state: incident.place,
    centroid: { lat: incident.lat, lon: incident.lon },
    hazard_type: incident.hazard_type,
    displaced_population: defaultPop,
    planning_window_mins: isCrit ? 60 : 120,
    primary_route_name: `${placeLabel} Primary Evacuation Highway Corridor`,
    hazard_summary: {
      severity: isCrit ? 'CRITICAL' : 'HIGH',
      rainfall_24h_mm: 68,
      cloudburst_intensity: isCrit ? 'Severe Hazard Sector' : 'Elevated Hazard Sector',
      soil_saturation_pct: 72,
      computed_hazard_index: incident.severity >= 6.0 ? 0.92 : (incident.severity >= 5.0 ? 0.78 : 0.65),
      flow_vector: { bearing_deg: 165, speed_mps: 1.8 }
    },
    satellite_telemetry: {
      sentinel1_sar: {
        orbit: 142,
        pass: 'DESCENDING',
        mode: 'IW (Interferometric Wide)',
        polarization: 'VV + VH',
        gamma0_backscatter_db: -14.6,
        specular_anomaly: true,
        scene_id: `S1A_IW_GRDH_1SDV_${incident.id.slice(0, 10).toUpperCase()}`,
        timestamp: new Date().toISOString()
      },
      sentinel2_optical: {
        tile: `T${Math.abs(Math.round(incident.lat))}${Math.abs(Math.round(incident.lon))}`,
        cloud_coverage_pct: 18,
        resolution_m: 10,
        ndwi_water_index: 0.58,
        ndvi_vegetation: 0.32,
        scene_id: `S2B_MSIL2A_${incident.id.slice(0, 8).toUpperCase()}`
      },
      cartosat3_highres: {
        sensor: 'PAN + 4-Band MX',
        gsd_pan_m: 0.28,
        gsd_ms_m: 1.12,
        structural_footprint_density_pct: 42,
        unblocked_open_ground_sqm: 14500,
        helipad_clearance_45m: 'CERTIFIED_CLEAR'
      },
      isro_bhuvan: {
        lulc_classification: 'Global Geographic Sector / Natural & Settlement Mosaic',
        historical_disaster_tier: isCrit ? 'Tier-1 Immediate Emergency Response' : 'Tier-2 Active Response',
        drainage_buffer_m: 350
      },
      worldpop: {
        grid_resolution: '100m constrained raster',
        estimated_aoi_exposure: defaultPop,
        vulnerable_demographics: { infants_pct: 14, elderly_pct: 18, mobility_impaired: 6 }
      }
    },
    srtm_transect: {
      min_elevation_m: 120,
      max_elevation_m: 680,
      max_gradient_pct: 18.2,
      points: [
        { dist_km: 0.0, elevation_m: 120, slope_pct: 4.1, label: 'Centroid Baseline' },
        { dist_km: 2.5, elevation_m: 230, slope_pct: 8.4, label: 'Ring 1 Foothill' },
        { dist_km: 5.0, elevation_m: 390, slope_pct: 14.1, label: 'Intermediate Ridge' },
        { dist_km: 8.0, elevation_m: 540, slope_pct: 17.5, label: 'Plateau Slope' },
        { dist_km: 12.0, elevation_m: 680, slope_pct: 11.2, label: 'Safe Plateau Sanctuary' }
      ]
    },
    candidate_sanctuaries: candidateSanctuaries,
    fleet_logistics: {
      total_evacuees: defaultPop,
      default_fleet_size: Math.max(16, Math.round(defaultPop / 65)),
      default_bus_capacity: 55,
      speed_kmh: 35,
      turnaround_time_mins: 45,
      total_cycles_needed: 2,
      evacuation_clearance_mins: 115,
      fuel_liters: Math.round(defaultPop * 0.12)
    },
    ddma_directive: {
      order_no: `INTEL/GLOBAL-EVAC/${incident.id.toUpperCase().slice(0, 14)}`,
      incident_commander: 'RAKSHA Operational Incident Commander',
      legal_act: 'UN OCHA / Sendai Disaster Framework Mandate',
      executive_summary: `Evacuation order executed for ${incident.title} (${incident.place}). Immediate relocation to approved safe candidate sanctuaries activated.`,
      authorized_actions: [
        `Mobilize transit bus convoys along ${placeLabel} Primary Evacuation Highway Corridor.`,
        `Establish primary humanitarian Sphere shelter reception at ${placeLabel} Regional Education Complex.`,
        `Enforce Zero-Tolerance Hard Veto against steep slopes and low-lying drainage parcels.`
      ]
    }
  };
}
