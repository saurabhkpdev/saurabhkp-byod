import * as XLSX from 'xlsx';
import { Template } from '@/components/TemplateSelector';

// Generate CSV content
export function generateSampleCSV(template: Template): string {
  const allColumns = [...template.requiredColumns, ...(template.optionalColumns || [])];
  const headers = allColumns.join(',');
  
  const rows = template.sampleData.map(row => 
    allColumns.map(col => {
      const value = row[col];
      if (value === undefined || value === null) return '';
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return String(value);
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

// Generate JSON content
export function generateSampleJSON(template: Template): string {
  return JSON.stringify(template.sampleData, null, 2);
}

// Generate GeoJSON content (for geographical templates)
export function generateSampleGeoJSON(template: Template): string | null {
  if (template.category !== 'geographical') return null;
  
  const features = template.sampleData.map((row, index) => {
    // Find latitude/longitude columns
    const lat = row['latitude'] ?? row['lat'] ?? row['Latitude'] ?? row['LAT'];
    const lng = row['longitude'] ?? row['lng'] ?? row['lon'] ?? row['Longitude'] ?? row['LNG'] ?? row['LON'];
    
    if (lat === undefined || lng === undefined) return null;
    
    // Create properties without lat/lng
    const properties = { ...row };
    delete properties['latitude'];
    delete properties['lat'];
    delete properties['Latitude'];
    delete properties['LAT'];
    delete properties['longitude'];
    delete properties['lng'];
    delete properties['lon'];
    delete properties['Longitude'];
    delete properties['LNG'];
    delete properties['LON'];
    
    return {
      type: 'Feature',
      id: index + 1,
      geometry: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      },
      properties
    };
  }).filter(Boolean);
  
  if (features.length === 0) return null;
  
  const geoJSON = {
    type: 'FeatureCollection',
    features
  };
  
  return JSON.stringify(geoJSON, null, 2);
}

// Generate KML content (for geographical templates)
export function generateSampleKML(template: Template): string | null {
  if (template.category !== 'geographical') return null;
  
  const placemarks = template.sampleData.map((row) => {
    const lat = row['latitude'] ?? row['lat'] ?? row['Latitude'] ?? row['LAT'];
    const lng = row['longitude'] ?? row['lng'] ?? row['lon'] ?? row['Longitude'] ?? row['LNG'] ?? row['LON'];
    
    if (lat === undefined || lng === undefined) return null;
    
    const name = row['name'] ?? row['facility_name'] ?? row['title'] ?? `Location`;
    const description = row['description'] ?? row['address'] ?? '';
    
    // Build extended data
    const extendedData = Object.entries(row)
      .filter(([key]) => !['latitude', 'lat', 'longitude', 'lng', 'lon', 'name', 'facility_name', 'title', 'description'].includes(key.toLowerCase()))
      .map(([key, value]) => `        <Data name="${key}"><value>${value}</value></Data>`)
      .join('\n');
    
    return `    <Placemark>
      <name>${escapeXML(String(name))}</name>
      <description>${escapeXML(String(description))}</description>
      <Point>
        <coordinates>${lng},${lat},0</coordinates>
      </Point>
      <ExtendedData>
${extendedData}
      </ExtendedData>
    </Placemark>`;
  }).filter(Boolean);
  
  if (placemarks.length === 0) return null;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${template.name}</name>
    <description>${template.description}</description>
${placemarks.join('\n')}
  </Document>
</kml>`;
}

// Generate XML content
export function generateSampleXML(template: Template): string {
  const rootName = template.name.toLowerCase().replace(/\s+/g, '_');
  const itemName = rootName.endsWith('s') ? rootName.slice(0, -1) : 'item';
  
  const items = template.sampleData.map(row => {
    const fields = Object.entries(row)
      .map(([key, value]) => `      <${key}>${escapeXML(String(value ?? ''))}</${key}>`)
      .join('\n');
    return `    <${itemName}>\n${fields}\n    </${itemName}>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<${rootName}>
${items}
</${rootName}>`;
}

// Generate Excel file and return as Blob
export function generateSampleExcel(template: Template): Blob {
  const allColumns = [...template.requiredColumns, ...(template.optionalColumns || [])];
  
  // Create worksheet data
  const wsData = [
    allColumns,
    ...template.sampleData.map(row => 
      allColumns.map(col => row[col] ?? '')
    )
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  // Generate buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Generate Shapefile ZIP archive (for geographical templates)
export async function generateSampleShapefile(template: Template): Promise<Blob | null> {
  if (template.category !== 'geographical') return null;
  
  // Generate GeoJSON first, then provide as ZIP with info
  const geojsonContent = generateSampleGeoJSON(template);
  if (!geojsonContent) return null;
  
  // Since browser-side shapefile creation is complex, we create a ZIP with GeoJSON + readme
  // explaining it can be converted using tools like QGIS or ogr2ogr
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  // Add GeoJSON that can be converted
  zip.file(`${template.name.toLowerCase().replace(/\s+/g, '_')}.geojson`, geojsonContent);
  
  // Add a readme explaining how to convert
  const readme = `# Shapefile Export

This ZIP contains a GeoJSON file that can be converted to Shapefile format.

## Converting to Shapefile

Use one of these methods:

1. **QGIS** (Free, Open Source):
   - Open the .geojson file in QGIS
   - Right-click the layer > Export > Save Features As...
   - Choose "ESRI Shapefile" format

2. **ogr2ogr** (Command Line):
   \`\`\`
   ogr2ogr -f "ESRI Shapefile" output.shp input.geojson
   \`\`\`

3. **Online Converters**:
   - https://mygeodata.cloud/converter/geojson-to-shp
   - https://mapshaper.org/

## Why GeoJSON?

Browser-based Shapefile generation requires complex binary encoding.
GeoJSON is widely supported and can be easily converted to Shapefile
using the methods above.
`;
  
  zip.file('README.txt', readme);
  
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

// Helper to escape XML special characters
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export type SampleFormat = 'csv' | 'xlsx' | 'json' | 'geojson' | 'xml' | 'kml' | 'shp';

export interface FormatOption {
  id: SampleFormat;
  label: string;
  extension: string;
  mimeType: string;
  geoOnly?: boolean;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { id: 'csv', label: 'CSV', extension: 'csv', mimeType: 'text/csv' },
  { id: 'xlsx', label: 'Excel', extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { id: 'json', label: 'JSON', extension: 'json', mimeType: 'application/json' },
  { id: 'xml', label: 'XML', extension: 'xml', mimeType: 'application/xml' },
  { id: 'geojson', label: 'GeoJSON', extension: 'geojson', mimeType: 'application/geo+json', geoOnly: true },
  { id: 'kml', label: 'KML', extension: 'kml', mimeType: 'application/vnd.google-earth.kml+xml', geoOnly: true },
  { id: 'shp', label: 'Shapefile', extension: 'zip', mimeType: 'application/zip', geoOnly: true },
];

// Download sample in specified format
export async function downloadSample(template: Template, format: SampleFormat): Promise<boolean> {
  const fileName = template.name.toLowerCase().replace(/\s+/g, '-');
  const formatOption = FORMAT_OPTIONS.find(f => f.id === format);
  
  if (!formatOption) return false;
  
  let content: string | Blob | null = null;
  
  switch (format) {
    case 'csv':
      content = generateSampleCSV(template);
      break;
    case 'xlsx':
      content = generateSampleExcel(template);
      break;
    case 'json':
      content = generateSampleJSON(template);
      break;
    case 'geojson':
      content = generateSampleGeoJSON(template);
      break;
    case 'xml':
      content = generateSampleXML(template);
      break;
    case 'kml':
      content = generateSampleKML(template);
      break;
    case 'shp':
      content = await generateSampleShapefile(template);
      break;
  }
  
  if (!content) return false;
  
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: `${formatOption.mimeType};charset=utf-8` });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}-sample.${formatOption.extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return true;
}

// Get available formats for a template
export function getAvailableFormats(template: Template): FormatOption[] {
  return FORMAT_OPTIONS.filter(format => 
    !format.geoOnly || template.category === 'geographical'
  );
}
