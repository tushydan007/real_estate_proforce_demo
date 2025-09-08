// src/components/AoiListPanel.tsx
"use client";

import type { Aoi } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type Props = {
  aois: Aoi[];
  onPreview: (id: number) => void;
  onEdit: (aoi: Aoi) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, field: "is_active" | "monitoring_enabled", value: boolean) => void;
};

export default function AoiListPanel({ aois, onPreview, onEdit, onDelete, onToggle }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      animate={{ width: open ? 300 : 40 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="h-full bg-white shadow-lg flex flex-col overflow-hidden"
    >
      <div className="flex justify-between items-center p-2 border-b">
        <span className="font-bold">{open ? "AOIs" : ""}</span>
        <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
          {open ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {open && (
        <div className="overflow-y-auto flex-1">
          {aois.map((aoi) => (
            <div key={aoi.id} className="border-b p-2 space-y-1">
              <div className="font-semibold">{aoi.name}</div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => aoi.id && onPreview(aoi.id)}>
                  <Eye size={16} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(aoi)}>
                  <Edit size={16} />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => aoi.id && onDelete(aoi.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Active</span>
                <Switch
                  checked={!!aoi.is_active}
                  onCheckedChange={(val) => aoi.id && onToggle(aoi.id, "is_active", val)}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Monitoring</span>
                <Switch
                  checked={!!aoi.monitoring_enabled}
                  onCheckedChange={(val) =>
                    aoi.id && onToggle(aoi.id, "monitoring_enabled", val)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
