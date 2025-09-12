"use client";

import { useMap } from "react-leaflet";
import type { MapComponentProps } from "../../../src/lib/types";
import { SearchControl } from "./SearchControl";
import { useAoiLayer } from "../../hooks/useAoiLayer";
import { useBaseMapLayers } from "../../hooks/useBaseMapLayers";

export const MapLogic = (props: MapComponentProps) => {
  const map = useMap();

  useBaseMapLayers(map);

  useAoiLayer({
    map,
    aois: props.aois.map((aoi) => ({
      ...aoi,
      is_active: aoi.is_active ?? false,
      monitoring_enabled: aoi.monitoring_enabled ?? false,
      created_at: aoi.created_at ? new Date(aoi.created_at) : undefined,
    })),
    onCreate: props.onCreate,
    onEdit: props.onEdit,
    onDelete: props.onDelete,
    onSelect: props.onSelect,
    previewAoiId: props.previewAoiId,
  });

  return (
    <>
      <SearchControl />
    </>
  );
};
