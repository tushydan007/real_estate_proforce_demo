import MapComponent from "@/components/MapComponent";
import type { Aoi } from "@/lib/types";
import { useState } from "react";

const MapPage = () => {
  const [aois, setAois] = useState<Aoi[]>([]);
  const [previewId, setPreviewId] = useState<number | undefined>(undefined);

  const handleCreate = (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => {
    const newAoi: Aoi = {
      id: Date.now(), // temp ID
      name: `AOI ${aois.length + 1}`,
      description: "New Area",
      geometry,
      is_active: true,
      monitoring_enabled: true,
    };
    setAois((prev) => [...prev, newAoi]);
  };

  const handleEdit = (
    id: number,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  ) => {
    setAois((prev) =>
      prev.map((aoi) => (aoi.id === id ? { ...aoi, geometry } : aoi))
    );
  };

  const handleDelete = (id: number) => {
    setAois((prev) => prev.filter((aoi) => aoi.id !== id));
  };

  const handleSelect = (id: number) => {
    setPreviewId(id);
    console.log("Selected AOI:", id);
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapComponent
        aois={aois}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelect={handleSelect}
        previewAoiId={previewId}
      />
    </div>
  );
};

export default MapPage;
