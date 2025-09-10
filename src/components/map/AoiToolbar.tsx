"use client";

import { Button } from "@/components/ui/button";
import type { Map } from "leaflet";
import { useAoiLayer } from "../../hooks/useAoiLayer";
import type { Aoi } from "../../../src/lib/types";

interface AoiToolbarProps {
  map: Map;
  aois: Aoi[];
  onCreate: (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => void;
  onEdit: (
    id: number,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  ) => void;
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
  previewAoiId?: number;
}

export const AoiToolbar = ({
  map,
  aois,
  onCreate,
  onEdit,
  onDelete,
  onSelect,
  previewAoiId,
}: AoiToolbarProps) => {
  const { startPolygon, startRectangle } = useAoiLayer({
    map,
    aois,
    onCreate,
    onEdit,
    onDelete,
    onSelect,
    previewAoiId,
  });

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 bg-white/90 p-3 rounded-xl shadow z-[1000]">
      <Button size="sm" onClick={startPolygon}>
        Draw Polygon
      </Button>
      <Button size="sm" onClick={startRectangle}>
        Draw Rectangle
      </Button>
    </div>
  );
};
