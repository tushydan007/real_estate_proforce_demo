"use client";

import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MapPin, X } from "lucide-react";
import { useMap } from "react-leaflet";
import L, { Marker } from "leaflet";
import toast from "react-hot-toast";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export const SearchControl = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const map = useMap();
  const markerRef = useRef<Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Position the search bar at the top-center of the map
  useEffect(() => {
    if (!map || !containerRef.current) return;

    // Capture the current ref value
    const currentContainer = containerRef.current;

    // Append the search bar to the map's container
    const mapContainer = map.getContainer();
    mapContainer.appendChild(currentContainer);

    // Apply Tailwind classes for top-center positioning
    currentContainer.classList.add(
      "absolute",
      "top-4",
      "left-1/2",
      "-translate-x-1/2",
      "z-[1000]",
      "w-96",
      "max-w-[90%]"
    );

    // Cleanup on unmount - use the captured value
    return () => {
      if (currentContainer && currentContainer.parentNode) {
        currentContainer.parentNode.removeChild(currentContainer);
      }
    };
  }, [map]);

  // Fetch suggestions (autocomplete)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (place: Suggestion) => {
    const { lat, lon, display_name } = place;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    const marker = L.marker([parseFloat(lat), parseFloat(lon)])
      .addTo(map)
      .bindPopup(display_name)
      .openPopup();

    markerRef.current = marker;
    map.flyTo([parseFloat(lat), parseFloat(lon)], 18, { duration: 2 });

    toast.success(`Found: ${display_name}`);
    setSuggestions([]); // Clear dropdown options
    setQuery(""); // Clear input field
  };

  const handleSearch = async () => {
    if (!query) {
      toast.error("Please enter a location to search");
      return;
    }

    try {
      setLoading(true);

      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=1`
        );
        const data: Suggestion[] = await res.json();

        if (data.length > 0) {
          handleSelect(data[0]);
        } else {
          toast.error("No results found");
        }
      }
    } catch (err) {
      toast.error("Search failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
      setQuery(""); // Clear input field
      setSuggestions([]); // Clear dropdown options
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    const regex = new RegExp(`(${query})`, "ig");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div
      ref={containerRef}
      className="bg-gray-100 rounded-md shadow-md p-2 w-80 max-w-[90%] z-[1000]"
    >
      <div className="flex items-center gap-2 relative">
        <Input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4 border rounded-full border-gray-400 cursor-pointer" />
          </button>
        )}
        <Button
          size="icon"
          onClick={handleSearch}
          disabled={loading}
          className="cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <ul className="max-h-60 overflow-y-auto bg-white border rounded-md shadow-md mt-2">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(s)}
            >
              <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm truncate">
                {highlightMatch(s.display_name, query)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
