import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

interface MapSearchControlProps {
  onLocationFound: (lat: number, lng: number, displayName: string) => void;
}

export const MapSearchControl = ({
  onLocationFound,
}: MapSearchControlProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ lat: string; lon: string; display_name: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isMediumUp = useMediaQuery("(min-width: 768px)");

  // 🔹 Debounced fetch for autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery + ", Ogun State, Nigeria"
          )}&limit=5`
        );
        const data: Array<{ lat: string; lon: string; display_name: string }> =
          await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Autocomplete error:", error);
      }
    }, 400); // debounce 400ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
        toast.error("Location not found. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (s: {
    lat: string;
    lon: string;
    display_name: string;
  }) => {
    setSearchQuery(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationFound(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
      <div className="flex gap-2 relative">
        <Input
          type="text"
          placeholder={isMediumUp ? "Search for a location..." : "Search..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          className="flex-1 bg-white shadow-lg md:w-64 w-44"
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching}
          className="shadow-lg cursor-pointer hover:bg-black/70"
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* 🔹 Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border rounded-md shadow-lg max-h-60 overflow-auto z-[2000]">
            {suggestions.map((s) => (
              <div
                key={`${s.lat}-${s.lon}`}
                onClick={() => handleSelectSuggestion(s)}
                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              >
                {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// import { useEffect, useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Search } from "lucide-react";
// import toast from "react-hot-toast";

// function useMediaQuery(query: string) {
//   const [matches, setMatches] = useState(false);

//   useEffect(() => {
//     const media = window.matchMedia(query);
//     if (media.matches !== matches) {
//       setMatches(media.matches);
//     }
//     const listener = () => setMatches(media.matches);
//     media.addEventListener("change", listener);
//     return () => media.removeEventListener("change", listener);
//   }, [matches, query]);

//   return matches;
// }

// interface MapSearchControlProps {
//   onLocationFound: (lat: number, lng: number, displayName: string) => void;
// }

// export const MapSearchControl = ({
//   onLocationFound,
// }: MapSearchControlProps) => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isSearching, setIsSearching] = useState(false);

//   const isMediumUp = useMediaQuery("(min-width: 768px)");

//   const handleSearch = async () => {
//     if (!searchQuery.trim()) return;
//     setIsSearching(true);

//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
//           searchQuery + ", Ogun State, Nigeria"
//         )}&limit=1`
//       );

//       const data: Array<{ lat: string; lon: string; display_name: string }> =
//         await response.json();

//       if (data.length > 0) {
//         const result = data[0];
//         onLocationFound(
//           parseFloat(result.lat),
//           parseFloat(result.lon),
//           result.display_name
//         );
//       } else {
//         toast("Location not found. Please try again.");
//       }
//     } catch (error) {
//       console.error("Search error:", error);
//       toast("Search failed. Please try again.");
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   return (
//     <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
//       <Input
//         type="text"
//         placeholder={isMediumUp ? "Search for a location..." : "Search..."}
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && handleSearch()}
//         className="md:w-64 w-36 bg-white shadow-lg"
//       />
//       <Button
//         onClick={handleSearch}
//         disabled={isSearching}
//         className="shadow-lg cursor-pointer hover:bg-black/70"
//       >
//         <Search className="w-4 h-4" />
//       </Button>
//     </div>
//   );
// };
