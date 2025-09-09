export type Aoi = {
  id?: number;
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  is_active?: boolean;
  monitoring_enabled?: boolean;
  created_at?: string;
};


export type Notification = {
id?: number;
verb?: string;
description?: string;
notification_type?: string;
priority?: string;
metadata?: any;
unread?: boolean;
timestamp?: string;
};

export interface MapComponentProps {
  aois: Aoi[]; // List of AOIs to display on the map
  onCreate: (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => void; // Callback when a new polygon/multipolygon is created
  onEdit: (id: number, geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => void; // Callback when an existing AOI is edited
  onDelete: (id: number) => void; // Callback when an AOI is deleted
  onSelect: (id: number) => void; // Callback when an AOI is clicked/selected
  previewAoiId?: number; // Optional: AOI id to highlight for preview
}