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

// Non-geographical datasets
const employeesData = [
  { employee_id: 'EMP-001', first_name: 'John', last_name: 'Smith', email: 'john.smith@company.com', department: 'Engineering', position: 'Senior Developer', hire_date: '2020-03-15', salary: 95000, performance_score: 4.5, is_remote: true },
  { employee_id: 'EMP-002', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@company.com', department: 'Marketing', position: 'Marketing Manager', hire_date: '2019-07-22', salary: 85000, performance_score: 4.8, is_remote: false },
  { employee_id: 'EMP-003', first_name: 'Michael', last_name: 'Williams', email: 'michael.williams@company.com', department: 'Sales', position: 'Sales Rep', hire_date: '2021-01-10', salary: 65000, performance_score: 3.9, is_remote: true },
  { employee_id: 'EMP-004', first_name: 'Emily', last_name: 'Brown', email: 'emily.brown@company.com', department: 'HR', position: 'HR Specialist', hire_date: '2018-11-05', salary: 72000, performance_score: 4.2, is_remote: false },
  { employee_id: 'EMP-005', first_name: 'David', last_name: 'Jones', email: 'david.jones@company.com', department: 'Engineering', position: 'Tech Lead', hire_date: '2017-06-18', salary: 125000, performance_score: 4.7, is_remote: true },
  { employee_id: 'EMP-006', first_name: 'Jessica', last_name: 'Garcia', email: 'jessica.garcia@company.com', department: 'Finance', position: 'Financial Analyst', hire_date: '2020-09-01', salary: 78000, performance_score: 4.1, is_remote: false },
  { employee_id: 'EMP-007', first_name: 'Robert', last_name: 'Martinez', email: 'robert.martinez@company.com', department: 'Engineering', position: 'Junior Developer', hire_date: '2022-04-12', salary: 62000, performance_score: 3.6, is_remote: true },
  { employee_id: 'EMP-008', first_name: 'Amanda', last_name: 'Anderson', email: 'amanda.anderson@company.com', department: 'Sales', position: 'Sales Manager', hire_date: '2016-02-28', salary: 98000, performance_score: 4.9, is_remote: false },
  { employee_id: 'EMP-009', first_name: 'Christopher', last_name: 'Taylor', email: 'christopher.taylor@company.com', department: 'Operations', position: 'Operations Lead', hire_date: '2019-08-14', salary: 82000, performance_score: 4.0, is_remote: true },
  { employee_id: 'EMP-010', first_name: 'Michelle', last_name: 'Thomas', email: 'michelle.thomas@company.com', department: 'Marketing', position: 'Content Specialist', hire_date: '2021-05-20', salary: 58000, performance_score: 4.3, is_remote: false },
  { employee_id: 'EMP-011', first_name: 'Daniel', last_name: 'Jackson', email: '', department: 'Engineering', position: 'DevOps Engineer', hire_date: '2020-11-30', salary: 105000, performance_score: 4.6, is_remote: true },
  { employee_id: 'EMP-012', first_name: '', last_name: 'White', email: 'unknown.white@company.com', department: 'Finance', position: 'Accountant', hire_date: '2018-03-22', salary: 68000, performance_score: 3.8, is_remote: false },
];

const productsData = [
  { product_id: 'PROD-001', name: 'Wireless Headphones', category: 'Electronics', brand: 'TechSound', price: 149.99, cost: 65.00, stock_quantity: 234, rating: 4.5, reviews: 1892, is_active: true, launch_date: '2023-01-15' },
  { product_id: 'PROD-002', name: 'Smart Watch Pro', category: 'Electronics', brand: 'WristTech', price: 299.99, cost: 120.00, stock_quantity: 156, rating: 4.7, reviews: 3421, is_active: true, launch_date: '2022-09-20' },
  { product_id: 'PROD-003', name: 'Organic Coffee Beans', category: 'Food & Beverage', brand: 'BeanMaster', price: 24.99, cost: 8.50, stock_quantity: 892, rating: 4.8, reviews: 567, is_active: true, launch_date: '2021-06-10' },
  { product_id: 'PROD-004', name: 'Yoga Mat Premium', category: 'Sports', brand: 'FlexFit', price: 79.99, cost: 22.00, stock_quantity: 445, rating: 4.3, reviews: 234, is_active: true, launch_date: '2022-03-05' },
  { product_id: 'PROD-005', name: 'LED Desk Lamp', category: 'Home & Office', brand: 'BrightLife', price: 59.99, cost: 18.00, stock_quantity: 0, rating: 4.1, reviews: 789, is_active: false, launch_date: '2020-11-28' },
  { product_id: 'PROD-006', name: 'Running Shoes X1', category: 'Sports', brand: 'SpeedRun', price: 189.99, cost: 75.00, stock_quantity: 312, rating: 4.6, reviews: 2156, is_active: true, launch_date: '2023-04-12' },
  { product_id: 'PROD-007', name: 'Portable Charger 20K', category: 'Electronics', brand: 'PowerPlus', price: 49.99, cost: 15.00, stock_quantity: 678, rating: 4.4, reviews: 945, is_active: true, launch_date: '2022-07-18' },
  { product_id: 'PROD-008', name: 'Stainless Steel Bottle', category: 'Home & Office', brand: 'EcoSip', price: 34.99, cost: 9.00, stock_quantity: 523, rating: 4.2, reviews: 412, is_active: true, launch_date: '2021-09-03' },
  { product_id: 'PROD-009', name: 'Noise Cancelling Earbuds', category: 'Electronics', brand: 'TechSound', price: 199.99, cost: 85.00, stock_quantity: 189, rating: 4.8, reviews: 3876, is_active: true, launch_date: '2023-02-28' },
  { product_id: 'PROD-010', name: 'Bamboo Cutting Board', category: 'Home & Office', brand: 'NatureHome', price: 29.99, cost: 7.50, stock_quantity: -5, rating: 4.0, reviews: 178, is_active: true, launch_date: '2020-05-15' },
  { product_id: 'PROD-011', name: 'Fitness Tracker Band', category: 'Electronics', brand: 'WristTech', price: 89.99, cost: 32.00, stock_quantity: 267, rating: 4.3, reviews: 1234, is_active: true, launch_date: '2022-12-01' },
  { product_id: 'PROD-012', name: 'Premium Notebook Set', category: 'Home & Office', brand: 'WriteWell', price: 19.99, cost: 4.00, stock_quantity: 1245, rating: 4.6, reviews: 567, is_active: true, launch_date: '2021-08-20' },
];

const transactionsData = [
  { transaction_id: 'TXN-001', customer_name: 'Alice Cooper', product: 'Wireless Headphones', quantity: 2, unit_price: 149.99, total_amount: 299.98, payment_method: 'Credit Card', status: 'Completed', transaction_date: '2024-01-15 10:23:45' },
  { transaction_id: 'TXN-002', customer_name: 'Bob Martin', product: 'Smart Watch Pro', quantity: 1, unit_price: 299.99, total_amount: 299.99, payment_method: 'PayPal', status: 'Completed', transaction_date: '2024-01-15 11:45:12' },
  { transaction_id: 'TXN-003', customer_name: 'Carol White', product: 'Yoga Mat Premium', quantity: 3, unit_price: 79.99, total_amount: 239.97, payment_method: 'Debit Card', status: 'Pending', transaction_date: '2024-01-15 14:02:33' },
  { transaction_id: 'TXN-004', customer_name: 'Dave Wilson', product: 'LED Desk Lamp', quantity: 1, unit_price: 59.99, total_amount: 59.99, payment_method: 'Credit Card', status: 'Failed', transaction_date: '2024-01-15 15:18:56' },
  { transaction_id: 'TXN-005', customer_name: 'Eve Johnson', product: 'Running Shoes X1', quantity: 1, unit_price: 189.99, total_amount: 189.99, payment_method: 'Apple Pay', status: 'Completed', transaction_date: '2024-01-15 16:30:22' },
  { transaction_id: 'TXN-006', customer_name: 'Frank Brown', product: 'Portable Charger 20K', quantity: 4, unit_price: 49.99, total_amount: 199.96, payment_method: 'Credit Card', status: 'Completed', transaction_date: '2024-01-16 09:12:45' },
  { transaction_id: 'TXN-007', customer_name: 'Grace Lee', product: 'Noise Cancelling Earbuds', quantity: 1, unit_price: 199.99, total_amount: 199.99, payment_method: 'PayPal', status: 'Refunded', transaction_date: '2024-01-16 10:45:33' },
  { transaction_id: 'TXN-008', customer_name: 'Henry Davis', product: 'Organic Coffee Beans', quantity: 5, unit_price: 24.99, total_amount: 124.95, payment_method: 'Debit Card', status: 'Completed', transaction_date: '2024-01-16 12:22:18' },
  { transaction_id: 'TXN-009', customer_name: 'Ivy Chen', product: 'Stainless Steel Bottle', quantity: 2, unit_price: 34.99, total_amount: 69.98, payment_method: 'Credit Card', status: 'Completed', transaction_date: '2024-01-16 14:55:41' },
  { transaction_id: 'TXN-010', customer_name: 'Jack Miller', product: 'Fitness Tracker Band', quantity: 1, unit_price: 89.99, total_amount: 89.99, payment_method: 'Google Pay', status: 'Pending', transaction_date: '2024-01-16 16:08:29' },
  { transaction_id: 'TXN-011', customer_name: 'Kate Robinson', product: 'Premium Notebook Set', quantity: 10, unit_price: 19.99, total_amount: 199.90, payment_method: 'Credit Card', status: 'Completed', transaction_date: '2024-01-17 08:34:12' },
  { transaction_id: 'TXN-012', customer_name: '', product: 'Smart Watch Pro', quantity: 1, unit_price: 299.99, total_amount: 299.99, payment_method: 'Credit Card', status: 'Completed', transaction_date: '2024-01-17 09:22:45' },
  { transaction_id: 'TXN-013', customer_name: 'Lucy Adams', product: 'Wireless Headphones', quantity: 1, unit_price: 149.99, total_amount: 149.99, payment_method: 'PayPal', status: 'Completed', transaction_date: '2024-01-17 11:15:33' },
  { transaction_id: 'TXN-014', customer_name: 'Mike Turner', product: 'Running Shoes X1', quantity: 2, unit_price: 189.99, total_amount: 379.98, payment_method: 'Credit Card', status: 'Completed', transaction_date: '2024-01-17 13:42:18' },
  { transaction_id: 'TXN-015', customer_name: 'Nancy Clark', product: 'Yoga Mat Premium', quantity: 1, unit_price: 79.99, total_amount: 79.99, payment_method: 'Debit Card', status: 'Completed', transaction_date: '2024-01-17 15:28:56' },
];

const surveyResponsesData = [
  { response_id: 1, respondent_age: 25, gender: 'Female', education: 'Bachelor', income_bracket: '$50K-$75K', satisfaction_score: 8, likelihood_to_recommend: 9, product_quality: 'Excellent', customer_service: 'Good', survey_date: '2024-01-10' },
  { response_id: 2, respondent_age: 34, gender: 'Male', education: 'Master', income_bracket: '$75K-$100K', satisfaction_score: 7, likelihood_to_recommend: 7, product_quality: 'Good', customer_service: 'Excellent', survey_date: '2024-01-10' },
  { response_id: 3, respondent_age: 45, gender: 'Female', education: 'PhD', income_bracket: '$100K+', satisfaction_score: 9, likelihood_to_recommend: 10, product_quality: 'Excellent', customer_service: 'Excellent', survey_date: '2024-01-11' },
  { response_id: 4, respondent_age: 28, gender: 'Male', education: 'Bachelor', income_bracket: '$25K-$50K', satisfaction_score: 5, likelihood_to_recommend: 4, product_quality: 'Average', customer_service: 'Poor', survey_date: '2024-01-11' },
  { response_id: 5, respondent_age: 52, gender: 'Female', education: 'High School', income_bracket: '$25K-$50K', satisfaction_score: 6, likelihood_to_recommend: 6, product_quality: 'Good', customer_service: 'Average', survey_date: '2024-01-12' },
  { response_id: 6, respondent_age: 31, gender: 'Non-binary', education: 'Master', income_bracket: '$75K-$100K', satisfaction_score: 8, likelihood_to_recommend: 8, product_quality: 'Good', customer_service: 'Good', survey_date: '2024-01-12' },
  { response_id: 7, respondent_age: 19, gender: 'Male', education: 'Some College', income_bracket: '<$25K', satisfaction_score: 7, likelihood_to_recommend: 7, product_quality: 'Good', customer_service: 'Good', survey_date: '2024-01-13' },
  { response_id: 8, respondent_age: 41, gender: 'Female', education: 'Bachelor', income_bracket: '$50K-$75K', satisfaction_score: 4, likelihood_to_recommend: 3, product_quality: 'Poor', customer_service: 'Average', survey_date: '2024-01-13' },
  { response_id: 9, respondent_age: 37, gender: 'Male', education: 'Master', income_bracket: '$100K+', satisfaction_score: 9, likelihood_to_recommend: 9, product_quality: 'Excellent', customer_service: 'Good', survey_date: '2024-01-14' },
  { response_id: 10, respondent_age: 23, gender: 'Female', education: 'Bachelor', income_bracket: '$25K-$50K', satisfaction_score: 6, likelihood_to_recommend: 5, product_quality: 'Average', customer_service: 'Average', survey_date: '2024-01-14' },
  { response_id: 11, respondent_age: null, gender: 'Male', education: 'PhD', income_bracket: '$100K+', satisfaction_score: 10, likelihood_to_recommend: 10, product_quality: 'Excellent', customer_service: 'Excellent', survey_date: '2024-01-15' },
  { response_id: 12, respondent_age: 29, gender: '', education: 'Bachelor', income_bracket: '$50K-$75K', satisfaction_score: 7, likelihood_to_recommend: 8, product_quality: 'Good', customer_service: 'Good', survey_date: '2024-01-15' },
];

const websiteAnalyticsData = [
  { date: '2024-01-01', page_views: 12543, unique_visitors: 4521, bounce_rate: 42.5, avg_session_duration: 245, conversions: 156, revenue: 15678.45, top_source: 'Organic Search', device_type: 'Desktop' },
  { date: '2024-01-02', page_views: 11234, unique_visitors: 4123, bounce_rate: 44.2, avg_session_duration: 232, conversions: 142, revenue: 14234.67, top_source: 'Direct', device_type: 'Mobile' },
  { date: '2024-01-03', page_views: 13456, unique_visitors: 4876, bounce_rate: 39.8, avg_session_duration: 267, conversions: 178, revenue: 17845.23, top_source: 'Social Media', device_type: 'Desktop' },
  { date: '2024-01-04', page_views: 14567, unique_visitors: 5234, bounce_rate: 38.5, avg_session_duration: 278, conversions: 192, revenue: 19234.56, top_source: 'Organic Search', device_type: 'Desktop' },
  { date: '2024-01-05', page_views: 15678, unique_visitors: 5678, bounce_rate: 36.2, avg_session_duration: 289, conversions: 215, revenue: 21567.89, top_source: 'Email Campaign', device_type: 'Desktop' },
  { date: '2024-01-06', page_views: 10234, unique_visitors: 3876, bounce_rate: 48.7, avg_session_duration: 198, conversions: 98, revenue: 9876.34, top_source: 'Organic Search', device_type: 'Mobile' },
  { date: '2024-01-07', page_views: 9876, unique_visitors: 3654, bounce_rate: 51.2, avg_session_duration: 187, conversions: 87, revenue: 8765.23, top_source: 'Direct', device_type: 'Mobile' },
  { date: '2024-01-08', page_views: 13789, unique_visitors: 4987, bounce_rate: 40.1, avg_session_duration: 256, conversions: 167, revenue: 16789.45, top_source: 'Paid Search', device_type: 'Desktop' },
  { date: '2024-01-09', page_views: 14234, unique_visitors: 5123, bounce_rate: 38.9, avg_session_duration: 271, conversions: 185, revenue: 18567.89, top_source: 'Organic Search', device_type: 'Desktop' },
  { date: '2024-01-10', page_views: 15123, unique_visitors: 5456, bounce_rate: 37.4, avg_session_duration: 283, conversions: 201, revenue: 20134.56, top_source: 'Referral', device_type: 'Desktop' },
  { date: '2024-01-11', page_views: 14567, unique_visitors: 5234, bounce_rate: 39.2, avg_session_duration: 268, conversions: 189, revenue: 18945.67, top_source: 'Social Media', device_type: 'Tablet' },
  { date: '2024-01-12', page_views: 13890, unique_visitors: 5012, bounce_rate: 41.5, avg_session_duration: 251, conversions: 172, revenue: 17234.89, top_source: 'Organic Search', device_type: 'Desktop' },
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
  {
    id: 'employees',
    name: 'Employee Directory',
    description: 'Company employee records with HR data',
    category: 'general',
    hasGeoData: false,
    data: employeesData,
  },
  {
    id: 'products',
    name: 'Product Catalog',
    description: 'E-commerce product inventory with pricing and ratings',
    category: 'general',
    hasGeoData: false,
    data: productsData,
  },
  {
    id: 'transactions',
    name: 'Sales Transactions',
    description: 'Recent transaction records with payment details',
    category: 'general',
    hasGeoData: false,
    data: transactionsData,
  },
  {
    id: 'survey-responses',
    name: 'Customer Survey',
    description: 'Customer satisfaction survey responses',
    category: 'general',
    hasGeoData: false,
    data: surveyResponsesData,
  },
  {
    id: 'website-analytics',
    name: 'Website Analytics',
    description: 'Daily website traffic and conversion metrics',
    category: 'general',
    hasGeoData: false,
    data: websiteAnalyticsData,
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
