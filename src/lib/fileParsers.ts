import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type ParseResult = {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
};

// Parse CSV/TSV files
export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({ success: false, error: `Error parsing file: ${results.errors[0].message}` });
          return;
        }
        resolve({ success: true, data: results.data as Record<string, unknown>[] });
      },
      error: (err) => {
        resolve({ success: false, error: `Error reading file: ${err.message}` });
      },
    });
  });
};

// Parse Excel files (.xlsx, .xls)
export const parseExcel = async (file: File): Promise<ParseResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, error: 'Excel file has no sheets' };
    }
    
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    
    return { success: true, data };
  } catch (err) {
    return { success: false, error: `Error parsing Excel file: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
};

// Parse JSON files
export const parseJSON = async (file: File): Promise<ParseResult> => {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    
    // Handle array of objects
    if (Array.isArray(parsed)) {
      return { success: true, data: parsed };
    }
    
    // Handle single object - wrap in array
    if (typeof parsed === 'object' && parsed !== null) {
      return { success: true, data: [parsed] };
    }
    
    return { success: false, error: 'JSON must be an array of objects or a single object' };
  } catch (err) {
    return { success: false, error: `Error parsing JSON file: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
};

// Parse GeoJSON files
export const parseGeoJSON = async (file: File): Promise<ParseResult> => {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    
    if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
      // Extract properties from each feature and add geometry info
      const data = parsed.features.map((feature: any, index: number) => ({
        _id: index + 1,
        _geometry_type: feature.geometry?.type || 'Unknown',
        _coordinates: JSON.stringify(feature.geometry?.coordinates),
        latitude: extractLatitude(feature.geometry),
        longitude: extractLongitude(feature.geometry),
        ...feature.properties,
      }));
      return { success: true, data };
    }
    
    if (parsed.type === 'Feature') {
      const data = [{
        _id: 1,
        _geometry_type: parsed.geometry?.type || 'Unknown',
        _coordinates: JSON.stringify(parsed.geometry?.coordinates),
        latitude: extractLatitude(parsed.geometry),
        longitude: extractLongitude(parsed.geometry),
        ...parsed.properties,
      }];
      return { success: true, data };
    }
    
    return { success: false, error: 'Invalid GeoJSON format. Expected FeatureCollection or Feature.' };
  } catch (err) {
    return { success: false, error: `Error parsing GeoJSON file: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
};

// Parse XML files
export const parseXML = async (file: File): Promise<ParseResult> => {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return { success: false, error: 'Invalid XML format' };
    }
    
    // Get root element's children as records
    const root = xmlDoc.documentElement;
    const records: Record<string, unknown>[] = [];
    
    // Try to find repeating elements (common patterns like <items><item>...</item></items>)
    const children = Array.from(root.children);
    
    if (children.length === 0) {
      // Single root element - convert to single record
      records.push(xmlElementToObject(root));
    } else {
      // Check if all children have the same tag name (likely a list)
      const firstTagName = children[0].tagName;
      const allSameTag = children.every(child => child.tagName === firstTagName);
      
      if (allSameTag) {
        // Convert each child to a record
        children.forEach(child => {
          records.push(xmlElementToObject(child));
        });
      } else {
        // Mixed children - treat root as single record
        records.push(xmlElementToObject(root));
      }
    }
    
    return { success: true, data: records };
  } catch (err) {
    return { success: false, error: `Error parsing XML file: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
};

// Parse KML files
export const parseKML = async (file: File): Promise<ParseResult> => {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return { success: false, error: 'Invalid KML format' };
    }
    
    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    const records: Record<string, unknown>[] = [];
    
    Array.from(placemarks).forEach((placemark, index) => {
      const record: Record<string, unknown> = {
        _id: index + 1,
      };
      
      // Extract name
      const nameEl = placemark.getElementsByTagName('name')[0];
      if (nameEl) record.name = nameEl.textContent;
      
      // Extract description
      const descEl = placemark.getElementsByTagName('description')[0];
      if (descEl) record.description = descEl.textContent;
      
      // Extract coordinates from Point
      const point = placemark.getElementsByTagName('Point')[0];
      if (point) {
        const coordsEl = point.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          const coords = coordsEl.textContent?.trim().split(',');
          if (coords && coords.length >= 2) {
            record.longitude = parseFloat(coords[0]);
            record.latitude = parseFloat(coords[1]);
            if (coords.length >= 3) record.altitude = parseFloat(coords[2]);
          }
        }
        record._geometry_type = 'Point';
      }
      
      // Extract coordinates from LineString
      const lineString = placemark.getElementsByTagName('LineString')[0];
      if (lineString) {
        const coordsEl = lineString.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          record._coordinates = coordsEl.textContent?.trim();
        }
        record._geometry_type = 'LineString';
      }
      
      // Extract coordinates from Polygon
      const polygon = placemark.getElementsByTagName('Polygon')[0];
      if (polygon) {
        const coordsEl = polygon.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          record._coordinates = coordsEl.textContent?.trim();
        }
        record._geometry_type = 'Polygon';
      }
      
      // Extract extended data
      const extendedData = placemark.getElementsByTagName('ExtendedData')[0];
      if (extendedData) {
        const dataElements = extendedData.getElementsByTagName('Data');
        Array.from(dataElements).forEach(dataEl => {
          const attrName = dataEl.getAttribute('name');
          const valueEl = dataEl.getElementsByTagName('value')[0];
          if (attrName && valueEl) {
            record[attrName] = valueEl.textContent;
          }
        });
        
        const simpleData = extendedData.getElementsByTagName('SimpleData');
        Array.from(simpleData).forEach(dataEl => {
          const attrName = dataEl.getAttribute('name');
          if (attrName) {
            record[attrName] = dataEl.textContent;
          }
        });
      }
      
      records.push(record);
    });
    
    if (records.length === 0) {
      return { success: false, error: 'No Placemark elements found in KML file' };
    }
    
    return { success: true, data: records };
  } catch (err) {
    return { success: false, error: `Error parsing KML file: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
};

// Parse Shapefile (requires .shp, .dbf files - simplified single-file approach)
export const parseShapefile = async (file: File): Promise<ParseResult> => {
  // Note: Full shapefile support requires multiple files (.shp, .dbf, .shx)
  // This is a simplified handler that informs users about the limitation
  return { 
    success: false, 
    error: 'Shapefile support requires uploading a ZIP containing .shp, .dbf, and .shx files. Please convert to GeoJSON for best results.' 
  };
};

// Helper functions
const extractLatitude = (geometry: any): number | null => {
  if (!geometry?.coordinates) return null;
  
  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates[1];
    case 'LineString':
    case 'MultiPoint':
      return geometry.coordinates[0]?.[1] || null;
    case 'Polygon':
    case 'MultiLineString':
      return geometry.coordinates[0]?.[0]?.[1] || null;
    default:
      return null;
  }
};

const extractLongitude = (geometry: any): number | null => {
  if (!geometry?.coordinates) return null;
  
  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates[0];
    case 'LineString':
    case 'MultiPoint':
      return geometry.coordinates[0]?.[0] || null;
    case 'Polygon':
    case 'MultiLineString':
      return geometry.coordinates[0]?.[0]?.[0] || null;
    default:
      return null;
  }
};

const xmlElementToObject = (element: Element): Record<string, unknown> => {
  const obj: Record<string, unknown> = {};
  
  // Add attributes
  Array.from(element.attributes).forEach(attr => {
    obj[`@${attr.name}`] = attr.value;
  });
  
  // Process child elements
  const children = Array.from(element.children);
  
  if (children.length === 0) {
    // Leaf node - use text content
    if (element.textContent) {
      obj['_value'] = element.textContent.trim();
    }
  } else {
    // Group children by tag name
    const grouped: Record<string, Element[]> = {};
    children.forEach(child => {
      if (!grouped[child.tagName]) grouped[child.tagName] = [];
      grouped[child.tagName].push(child);
    });
    
    // Convert each group
    Object.entries(grouped).forEach(([tagName, elements]) => {
      if (elements.length === 1) {
        const childObj = xmlElementToObject(elements[0]);
        // If child only has _value, use that directly
        if (Object.keys(childObj).length === 1 && '_value' in childObj) {
          obj[tagName] = childObj['_value'];
        } else {
          obj[tagName] = childObj;
        }
      } else {
        obj[tagName] = elements.map(el => {
          const childObj = xmlElementToObject(el);
          if (Object.keys(childObj).length === 1 && '_value' in childObj) {
            return childObj['_value'];
          }
          return childObj;
        });
      }
    });
  }
  
  return obj;
};

// Supported file extensions
export const SUPPORTED_EXTENSIONS = [
  '.csv', '.tsv', '.txt',  // CSV/TSV
  '.xlsx', '.xls',          // Excel
  '.json',                  // JSON
  '.geojson',               // GeoJSON
  '.xml',                   // XML
  '.kml',                   // KML
  '.shp', '.zip',           // Shapefile (zip)
];

export const ACCEPT_STRING = SUPPORTED_EXTENSIONS.join(',');

// Get parser based on file extension
export const getFileParser = (fileName: string): ((file: File) => Promise<ParseResult>) | null => {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
  
  switch (ext) {
    case '.csv':
    case '.tsv':
    case '.txt':
      return parseCSV;
    case '.xlsx':
    case '.xls':
      return parseExcel;
    case '.json':
      return parseJSON;
    case '.geojson':
      return parseGeoJSON;
    case '.xml':
      return parseXML;
    case '.kml':
      return parseKML;
    case '.shp':
    case '.zip':
      return parseShapefile;
    default:
      return null;
  }
};

// Get file type display name
export const getFileTypeLabel = (fileName: string): string => {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
  
  switch (ext) {
    case '.csv':
    case '.tsv':
    case '.txt':
      return 'CSV/TSV';
    case '.xlsx':
    case '.xls':
      return 'Excel';
    case '.json':
      return 'JSON';
    case '.geojson':
      return 'GeoJSON';
    case '.xml':
      return 'XML';
    case '.kml':
      return 'KML';
    case '.shp':
    case '.zip':
      return 'Shapefile';
    default:
      return 'Unknown';
  }
};
