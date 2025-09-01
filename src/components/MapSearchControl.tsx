import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

interface MapSearchControlProps {
  onLocationFound: (lat: number, lng: number, displayName: string) => void;
}

export const MapSearchControl = ({
  onLocationFound,
}: MapSearchControlProps) => {
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Ogun State, Nigeria"
        )}&limit=1`
      );

      const data: Array<{ lat: string; lon: string; display_name: string }> =
        await response.json();

      if (data.length > 0) {
        const result = data[0];
        onLocationFound(
          parseFloat(result.lat),
          parseFloat(result.lon),
          result.display_name
        );
      } else {
        toast("Location not found. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
      <Input
        type="text"
        placeholder="Search for a location..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="w-64 bg-white shadow-lg"
      />
      <Button
        onClick={handleSearch}
        disabled={isSearching}
        className="shadow-lg"
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
};
