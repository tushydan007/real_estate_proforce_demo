import type { Feature, FeatureCollection, Geometry } from "geojson";


export interface PropertyFeatureProperties {
  fid: number;
  id: string;
  unit: string;
  parentCompany: string;
  unitType: string;
  unitUse: string;
  area: number;
  noOfBuildings: number;
  condition: string;
  unitManager: string;
  address: string;
  lastUpdated: string;
  price: number;
  contact: string;
}

export type PropertyFeature = Feature<Geometry, PropertyFeatureProperties>;
export type PropertyFeatureCollection = FeatureCollection<
  Geometry,
  PropertyFeatureProperties
>;
