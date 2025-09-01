import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";

interface LayerControlProps {
  mapLayers: { name: string; url: string; attribution: string }[];
  currentLayer: number;
  onLayerChange: (index: number) => void;
}

export const LayerControl = ({
  mapLayers,
  currentLayer,
  onLayerChange,
}: LayerControlProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="shadow-lg bg-white text-black hover:bg-gray-100"
      >
        <Layers className="w-4 h-4" />
      </Button>
      {isOpen && (
        <Card className="absolute top-12 right-0 w-48 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm">Map Layers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mapLayers.map((layer, index) => (
              <Button
                key={layer.name}
                variant={currentLayer === index ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onLayerChange(index);
                  setIsOpen(false);
                }}
                className="w-full justify-start"
              >
                {layer.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
