// src/pages/AoiDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import MapComponent from "@/components/MapComponent";
import AoiListPanel from "@/components/AoiListPanel";
import SaveAoiModal from "@/components/SaveAoiModal";
import type { Aoi } from "@/lib/types";
import { getAois, createAoi, updateAoi, deleteAoi } from "@/lib/api";
import toast from "react-hot-toast";

export default function AoiDashboard() {
  const [aois, setAois] = useState<Aoi[]>([]);
  const [previewId, setPreviewId] = useState<number>();
  const [editingAoi, setEditingAoi] = useState<Aoi>();
  const [modalOpen, setModalOpen] = useState(false);
  const [tempGeometry, setTempGeometry] = useState<GeoJSON.Polygon | GeoJSON.MultiPolygon>();

  useEffect(() => {
    getAois().then(setAois);
  }, []);

  const handleCreate = (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => {
    setTempGeometry(geometry);
    setModalOpen(true);
  };

  const handleSave = async (aoi: Aoi) => {
    if (aoi.id) {
      const updated = await updateAoi(aoi.id, aoi);
      setAois((prev) => prev.map((p) => (p.id === aoi.id ? updated : p)));
      toast.success("AOI updated");
    } else {
      const created = await createAoi(aoi);
      setAois((prev) => [...prev, created]);
      toast.success("AOI created");
    }
  };

  const handleDelete = async (id: number) => {
    await deleteAoi(id);
    setAois((prev) => prev.filter((a) => a.id !== id));
    toast.success("AOI deleted");
  };

  const handleToggle = async (id: number, field: "is_active" | "monitoring_enabled", value: boolean) => {
    const target = aois.find((a) => a.id === id);
    if (!target) return;
    const updated = await updateAoi(id, { ...target, [field]: value });
    setAois((prev) => prev.map((p) => (p.id === id ? updated : p)));
    toast.success(`AOI ${field} updated`);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <MapComponent
          aois={aois}
          onCreate={handleCreate}
          onEdit={(id, geo) => handleSave({ ...aois.find((a) => a.id === id)!, geometry: geo })}
          onDelete={handleDelete}
          previewAoiId={previewId}
          onSelect={(id) => setPreviewId(id)}
        />
      </div>
      <AoiListPanel
        aois={aois}
        onPreview={(id) => setPreviewId(id)}
        onEdit={(aoi) => {
          setEditingAoi(aoi);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
      <SaveAoiModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAoi(undefined);
          setTempGeometry(undefined);
        }}
        onSave={handleSave}
        initialData={editingAoi}
        geometry={tempGeometry}
      />
    </div>
  );
}
