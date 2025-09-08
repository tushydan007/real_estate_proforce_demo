// src/components/SaveAoiModal.tsx
"use client";

import type { Aoi } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (aoi: Aoi) => void;
  initialData?: Aoi;
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};

export default function SaveAoiModal({
  open,
  onClose,
  onSave,
  initialData,
  geometry,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [monitoring, setMonitoring] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? "");
      setIsActive(initialData.is_active ?? true);
      setMonitoring(initialData.monitoring_enabled ?? false);
    } else {
      setName("");
      setDescription("");
      setIsActive(true);
      setMonitoring(false);
    }
  }, [initialData]);

  const handleSave = () => {
    if (!geometry && !initialData?.geometry) {
      // Decide how you want to handle this — e.g. block save:
      toast.error("No geometry provided");
      return;
    }

    onSave({
      ...initialData,
      name,
      description,
      geometry:
        geometry ??
        (initialData?.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon),
      is_active: isActive,
      monitoring_enabled: monitoring,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit AOI" : "Save AOI"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span>Active</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex items-center justify-between">
            <span>Monitoring</span>
            <Switch checked={monitoring} onCheckedChange={setMonitoring} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
