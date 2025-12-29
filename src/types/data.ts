export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  isPII: boolean;
}

export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface DataStats {
  column: string;
  count: number;
  nullCount: number;
  unique: number;
  mean?: number;
  min?: number | string;
  max?: number | string;
  type: string;
}

export interface UploadedData {
  columns: DataColumn[];
  rows: DataRow[];
  fileName: string;
}
