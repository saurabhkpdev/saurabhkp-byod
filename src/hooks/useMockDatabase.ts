import { useState, useCallback } from 'react';

export interface MockDataset {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'geographical';
  hasGeoData: boolean;
  data: Record<string, unknown>[];
}

// European locations with points and regions
const europeLocationsData = [
  { id: 1, name: 'Eiffel Tower', type: 'landmark', country: 'France', city: 'Paris', latitude: 48.8584, longitude: 2.2945, visitors: 7000000, category: 'Tourism' },
  { id: 2, name: 'Brandenburg Gate', type: 'landmark', country: 'Germany', city: 'Berlin', latitude: 52.5163, longitude: 13.3777, visitors: 3000000, category: 'Tourism' },
  { id: 3, name: 'Colosseum', type: 'landmark', country: 'Italy', city: 'Rome', latitude: 41.8902, longitude: 12.4922, visitors: 7600000, category: 'Tourism' },
  { id: 4, name: 'Sagrada Familia', type: 'landmark', country: 'Spain', city: 'Barcelona', latitude: 41.4036, longitude: 2.1744, visitors: 4500000, category: 'Tourism' },
  { id: 5, name: 'Big Ben', type: 'landmark', country: 'UK', city: 'London', latitude: 51.5007, longitude: -0.1246, visitors: 2000000, category: 'Tourism' },
  { id: 6, name: 'Louvre Museum', type: 'museum', country: 'France', city: 'Paris', latitude: 48.8606, longitude: 2.3376, visitors: 9600000, category: 'Culture' },
  { id: 7, name: 'Van Gogh Museum', type: 'museum', country: 'Netherlands', city: 'Amsterdam', latitude: 52.3584, longitude: 4.8811, visitors: 2100000, category: 'Culture' },
  { id: 8, name: 'Acropolis', type: 'landmark', country: 'Greece', city: 'Athens', latitude: 37.9715, longitude: 23.7267, visitors: 2900000, category: 'Tourism' },
  { id: 9, name: 'Charles Bridge', type: 'landmark', country: 'Czech Republic', city: 'Prague', latitude: 50.0865, longitude: 14.4114, visitors: 1500000, category: 'Tourism' },
  { id: 10, name: 'Schönbrunn Palace', type: 'palace', country: 'Austria', city: 'Vienna', latitude: 48.1845, longitude: 16.3122, visitors: 3800000, category: 'Tourism' },
  { id: 11, name: 'Manneken Pis', type: 'landmark', country: 'Belgium', city: 'Brussels', latitude: 50.8450, longitude: 4.3500, visitors: 500000, category: 'Tourism' },
  { id: 12, name: 'Matterhorn', type: 'natural', country: 'Switzerland', city: 'Zermatt', latitude: 45.9763, longitude: 7.6586, visitors: 200000, category: 'Nature' },
  { id: 13, name: 'Fjords', type: 'natural', country: 'Norway', city: 'Bergen', latitude: 60.3913, longitude: 5.3221, visitors: 450000, category: 'Nature' },
  { id: 14, name: 'Northern Lights', type: 'natural', country: 'Finland', city: 'Rovaniemi', latitude: 66.5039, longitude: 25.7294, visitors: 350000, category: 'Nature' },
  { id: 15, name: 'Plitvice Lakes', type: 'natural', country: 'Croatia', city: 'Plitvice', latitude: 44.8654, longitude: 15.5820, visitors: 1200000, category: 'Nature' },
];

const salesRegionsData = [
  { id: 1, region_name: 'Northern France', country: 'France', manager: 'Pierre Dubois', sales_2024: 2450000, target: 2500000, employees: 45, latitude: 49.4432, longitude: 1.0993, polygon: '[[49.0, 0.5], [49.0, 2.5], [50.5, 2.5], [50.5, 0.5]]' },
  { id: 2, region_name: 'Bavaria', country: 'Germany', manager: 'Klaus Schmidt', sales_2024: 3200000, target: 3000000, employees: 62, latitude: 48.7904, longitude: 11.4979, polygon: '[[47.5, 10.0], [47.5, 13.5], [50.0, 13.5], [50.0, 10.0]]' },
  { id: 3, region_name: 'Lombardy', country: 'Italy', manager: 'Marco Rossi', sales_2024: 1850000, target: 2000000, employees: 38, latitude: 45.4642, longitude: 9.1900, polygon: '[[45.0, 8.5], [45.0, 10.5], [46.5, 10.5], [46.5, 8.5]]' },
  { id: 4, region_name: 'Catalonia', country: 'Spain', manager: 'Ana Garcia', sales_2024: 1620000, target: 1700000, employees: 35, latitude: 41.3851, longitude: 2.1734, polygon: '[[40.5, 0.5], [40.5, 3.0], [42.5, 3.0], [42.5, 0.5]]' },
  { id: 5, region_name: 'South England', country: 'UK', manager: 'James Wilson', sales_2024: 2980000, target: 2800000, employees: 55, latitude: 51.5074, longitude: -0.1278, polygon: '[[50.5, -2.0], [50.5, 1.5], [52.0, 1.5], [52.0, -2.0]]' },
  { id: 6, region_name: 'Randstad', country: 'Netherlands', manager: 'Jan de Vries', sales_2024: 1420000, target: 1500000, employees: 28, latitude: 52.3676, longitude: 4.9041, polygon: '[[51.8, 4.0], [51.8, 5.5], [52.8, 5.5], [52.8, 4.0]]' },
  { id: 7, region_name: 'Greater Vienna', country: 'Austria', manager: 'Hans Müller', sales_2024: 980000, target: 1000000, employees: 22, latitude: 48.2082, longitude: 16.3738, polygon: '[[47.8, 15.8], [47.8, 17.0], [48.6, 17.0], [48.6, 15.8]]' },
  { id: 8, region_name: 'Attica', country: 'Greece', manager: 'Nikos Papadopoulos', sales_2024: 720000, target: 800000, employees: 18, latitude: 37.9838, longitude: 23.7275, polygon: '[[37.5, 23.0], [37.5, 24.5], [38.5, 24.5], [38.5, 23.0]]' },
];

const environmentalSensorsData = [
  { sensor_id: 'ENV-001', location: 'Paris Center', country: 'France', latitude: 48.8566, longitude: 2.3522, temperature: 18.5, humidity: 65, air_quality_index: 42, last_reading: '2024-01-15 14:30:00' },
  { sensor_id: 'ENV-002', location: 'Berlin Mitte', country: 'Germany', latitude: 52.5200, longitude: 13.4050, temperature: 12.3, humidity: 72, air_quality_index: 38, last_reading: '2024-01-15 14:32:00' },
  { sensor_id: 'ENV-003', location: 'Rome Centro', country: 'Italy', latitude: 41.9028, longitude: 12.4964, temperature: 22.1, humidity: 58, air_quality_index: 55, last_reading: '2024-01-15 14:28:00' },
  { sensor_id: 'ENV-004', location: 'Madrid Sol', country: 'Spain', latitude: 40.4168, longitude: -3.7038, temperature: 24.7, humidity: 45, air_quality_index: 48, last_reading: '2024-01-15 14:35:00' },
  { sensor_id: 'ENV-005', location: 'London Westminster', country: 'UK', latitude: 51.5074, longitude: -0.1278, temperature: 14.2, humidity: 78, air_quality_index: 52, last_reading: '2024-01-15 14:31:00' },
  { sensor_id: 'ENV-006', location: 'Amsterdam Centrum', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041, temperature: 11.8, humidity: 82, air_quality_index: 35, last_reading: '2024-01-15 14:29:00' },
  { sensor_id: 'ENV-007', location: 'Vienna Innere Stadt', country: 'Austria', latitude: 48.2082, longitude: 16.3738, temperature: 15.6, humidity: 68, air_quality_index: 32, last_reading: '2024-01-15 14:33:00' },
  { sensor_id: 'ENV-008', location: 'Prague Old Town', country: 'Czech Republic', latitude: 50.0755, longitude: 14.4378, temperature: 10.4, humidity: 75, air_quality_index: 41, last_reading: '2024-01-15 14:27:00' },
  { sensor_id: 'ENV-009', location: 'Athens Plaka', country: 'Greece', latitude: 37.9715, longitude: 23.7267, temperature: 26.8, humidity: 52, air_quality_index: 62, last_reading: '2024-01-15 14:34:00' },
  { sensor_id: 'ENV-010', location: 'Brussels Grand Place', country: 'Belgium', latitude: 50.8503, longitude: 4.3517, temperature: 13.1, humidity: 76, air_quality_index: 45, last_reading: '2024-01-15 14:30:00' },
  { sensor_id: 'ENV-011', location: 'Stockholm Gamla Stan', country: 'Sweden', latitude: 59.3251, longitude: 18.0711, temperature: 5.2, humidity: 85, air_quality_index: 28, last_reading: '2024-01-15 14:36:00' },
  { sensor_id: 'ENV-012', location: 'Copenhagen Nyhavn', country: 'Denmark', latitude: 55.6794, longitude: 12.5868, temperature: 7.8, humidity: 80, air_quality_index: 30, last_reading: '2024-01-15 14:28:00' },
];

const deliveryZonesData = [
  { zone_id: 'DZ-001', zone_name: 'Paris Express', country: 'France', center_lat: 48.8566, center_lng: 2.3522, radius_km: 15, deliveries_per_day: 450, avg_delivery_time: 28, drivers: 35, polygon: '[[48.75, 2.15], [48.75, 2.55], [48.95, 2.55], [48.95, 2.15]]' },
  { zone_id: 'DZ-002', zone_name: 'Berlin Metro', country: 'Germany', center_lat: 52.5200, center_lng: 13.4050, radius_km: 20, deliveries_per_day: 520, avg_delivery_time: 32, drivers: 42, polygon: '[[52.35, 13.15], [52.35, 13.65], [52.65, 13.65], [52.65, 13.15]]' },
  { zone_id: 'DZ-003', zone_name: 'Milan Urban', country: 'Italy', center_lat: 45.4642, center_lng: 9.1900, radius_km: 12, deliveries_per_day: 380, avg_delivery_time: 25, drivers: 28, polygon: '[[45.35, 9.05], [45.35, 9.35], [45.55, 9.35], [45.55, 9.05]]' },
  { zone_id: 'DZ-004', zone_name: 'Barcelona City', country: 'Spain', center_lat: 41.3851, center_lng: 2.1734, radius_km: 14, deliveries_per_day: 410, avg_delivery_time: 30, drivers: 32, polygon: '[[41.25, 2.05], [41.25, 2.30], [41.50, 2.30], [41.50, 2.05]]' },
  { zone_id: 'DZ-005', zone_name: 'London Central', country: 'UK', center_lat: 51.5074, center_lng: -0.1278, radius_km: 18, deliveries_per_day: 680, avg_delivery_time: 35, drivers: 55, polygon: '[[51.40, -0.35], [51.40, 0.10], [51.65, 0.10], [51.65, -0.35]]' },
  { zone_id: 'DZ-006', zone_name: 'Amsterdam Ring', country: 'Netherlands', center_lat: 52.3676, center_lng: 4.9041, radius_km: 10, deliveries_per_day: 290, avg_delivery_time: 22, drivers: 22, polygon: '[[52.28, 4.75], [52.28, 5.05], [52.45, 5.05], [52.45, 4.75]]' },
];

const customerLocationsData = [
  { customer_id: 'CUST-001', name: 'Acme Corp', type: 'Enterprise', country: 'France', city: 'Paris', address: '15 Rue de Rivoli', latitude: 48.8588, longitude: 2.3470, revenue: 125000, orders: 45, status: 'Active' },
  { customer_id: 'CUST-002', name: 'TechStart GmbH', type: 'Startup', country: 'Germany', city: 'Berlin', address: 'Alexanderplatz 1', latitude: 52.5219, longitude: 13.4132, revenue: 45000, orders: 18, status: 'Active' },
  { customer_id: 'CUST-003', name: 'Moda Italia', type: 'SMB', country: 'Italy', city: 'Milan', address: 'Via Montenapoleone 8', latitude: 45.4687, longitude: 9.1950, revenue: 78000, orders: 32, status: 'Active' },
  { customer_id: 'CUST-004', name: 'Barcelona Imports', type: 'Enterprise', country: 'Spain', city: 'Barcelona', address: 'Passeig de Gràcia 92', latitude: 41.3954, longitude: 2.1631, revenue: 156000, orders: 52, status: 'Active' },
  { customer_id: 'CUST-005', name: 'London Finance Ltd', type: 'Enterprise', country: 'UK', city: 'London', address: '1 Canary Wharf', latitude: 51.5054, longitude: -0.0235, revenue: 234000, orders: 78, status: 'VIP' },
  { customer_id: 'CUST-006', name: 'Dutch Trading Co', type: 'SMB', country: 'Netherlands', city: 'Amsterdam', address: 'Damrak 25', latitude: 52.3750, longitude: 4.8950, revenue: 67000, orders: 28, status: 'Active' },
  { customer_id: 'CUST-007', name: 'Vienna Solutions', type: 'Startup', country: 'Austria', city: 'Vienna', address: 'Stephansplatz 3', latitude: 48.2085, longitude: 16.3725, revenue: 38000, orders: 15, status: 'New' },
  { customer_id: 'CUST-008', name: 'Prague Digital', type: 'SMB', country: 'Czech Republic', city: 'Prague', address: 'Wenceslas Square 12', latitude: 50.0815, longitude: 14.4278, revenue: 52000, orders: 22, status: 'Active' },
  { customer_id: 'CUST-009', name: 'Athens Shipping', type: 'Enterprise', country: 'Greece', city: 'Athens', address: 'Syntagma Square 5', latitude: 37.9755, longitude: 23.7348, revenue: 189000, orders: 64, status: 'VIP' },
  { customer_id: 'CUST-010', name: 'Brussels EU Services', type: 'Enterprise', country: 'Belgium', city: 'Brussels', address: 'Rue de la Loi 175', latitude: 50.8430, longitude: 4.3815, revenue: 198000, orders: 71, status: 'VIP' },
  { customer_id: 'CUST-011', name: 'Stockholm Nordic', type: 'SMB', country: 'Sweden', city: 'Stockholm', address: 'Kungsgatan 44', latitude: 59.3346, longitude: 18.0632, revenue: 72000, orders: 26, status: 'Active' },
  { customer_id: 'CUST-012', name: 'Copenhagen Green', type: 'Startup', country: 'Denmark', city: 'Copenhagen', address: 'Strøget 15', latitude: 55.6779, longitude: 12.5710, revenue: 41000, orders: 17, status: 'New' },
];

export const mockDatasets: MockDataset[] = [
  {
    id: 'europe-landmarks',
    name: 'European Landmarks',
    description: 'Famous landmarks and attractions across Europe with visitor data',
    category: 'geographical',
    hasGeoData: true,
    data: europeLocationsData,
  },
  {
    id: 'sales-regions',
    name: 'Sales Territories',
    description: 'Regional sales data with territory boundaries',
    category: 'geographical',
    hasGeoData: true,
    data: salesRegionsData,
  },
  {
    id: 'environmental-sensors',
    name: 'Environmental Sensors',
    description: 'IoT sensor network monitoring environmental conditions',
    category: 'geographical',
    hasGeoData: true,
    data: environmentalSensorsData,
  },
  {
    id: 'delivery-zones',
    name: 'Delivery Zones',
    description: 'Delivery service zones with performance metrics',
    category: 'geographical',
    hasGeoData: true,
    data: deliveryZonesData,
  },
  {
    id: 'customer-locations',
    name: 'Customer Locations',
    description: 'B2B customer directory with location data',
    category: 'geographical',
    hasGeoData: true,
    data: customerLocationsData,
  },
];

export const useMockDatabase = () => {
  const [datasets] = useState<MockDataset[]>(mockDatasets);
  const [selectedDataset, setSelectedDataset] = useState<MockDataset | null>(null);

  const loadDataset = useCallback((datasetId: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      setSelectedDataset(dataset);
      return dataset.data;
    }
    return null;
  }, [datasets]);

  const getGeographicalDatasets = useCallback(() => {
    return datasets.filter(d => d.hasGeoData);
  }, [datasets]);

  const getAllDatasets = useCallback(() => {
    return datasets;
  }, [datasets]);

  return {
    datasets,
    selectedDataset,
    loadDataset,
    getGeographicalDatasets,
    getAllDatasets,
    setSelectedDataset,
  };
};
