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