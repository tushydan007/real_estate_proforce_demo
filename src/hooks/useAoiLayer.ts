// INTEGRATED AOI LAYER WITH CART SYSTEM
import L from "leaflet";
import "leaflet-draw";
import type { Map } from "leaflet";
import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import {
  addAoiToCart,
  removeAoiFromCart,
  formatArea,
  formatCoordinates,
  type AoiCartItem,
} from "../redux/features/cart/AoiCartSlice";
import toast from "react-hot-toast";
import "leaflet-draw/dist/leaflet.draw.css";

// Base AOI interface (from your existing types)
export interface Aoi {
  id?: number;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  is_active: boolean;
  monitoring_enabled: boolean;
  created_at?: Date;
  name?: string;
  description?: string;
  tags?: string[];
}

interface UseAoiLayerProps {
  map: Map;
  aois: Aoi[];
  onCreate: (
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    area: number
  ) => void;
  onEdit: (
    id: number,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    area: number
  ) => void;
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
  previewAoiId?: number;
  autoAddToCart?: boolean;
}

// Simple tooltip creation/removal helpers
const createTooltip = () => {
  const tooltip = document.createElement("div");
  tooltip.style.position = "fixed";
  tooltip.style.pointerEvents = "none";
  tooltip.style.background = "rgba(0,0,0,0.9)";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "8px 12px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "12px";
  tooltip.style.zIndex = "9999";
  tooltip.style.transition = "opacity 0.2s";
  tooltip.style.opacity = "0.95";
  tooltip.style.maxWidth = "300px";
  tooltip.style.wordWrap = "break-word";
  document.body.appendChild(tooltip);
  return tooltip;
};

const removeTooltip = (tooltip: HTMLElement | null) => {
  if (tooltip && tooltip.parentNode) {
    tooltip.parentNode.removeChild(tooltip);
  }
};

type GeometryUtilType = {
  geodesicArea: (latlngs: L.LatLng[]) => number;
};

const getPolygonArea = (latlngs: L.LatLng[]): number => {
  const geometryUtil = (L as unknown as { GeometryUtil?: GeometryUtilType })
    .GeometryUtil;
  if (geometryUtil && typeof geometryUtil.geodesicArea === "function") {
    return geometryUtil.geodesicArea(latlngs);
  }

  // Enhanced Shoelace formula with Earth's radius
  const R = 6371000; // Earth's radius in meters
  let area = 0;

  if (latlngs.length < 3) return 0;

  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    const lat1 = (latlngs[i].lat * Math.PI) / 180;
    const lat2 = (latlngs[j].lat * Math.PI) / 180;
    const lng1 = (latlngs[i].lng * Math.PI) / 180;
    const lng2 = (latlngs[j].lng * Math.PI) / 180;

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * R * R) / 2;
  return area;
};

// Calculate area from GeoJSON geometry
const calculateAreaFromGeometry = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): number => {
  let totalArea = 0;

  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates[0];
    const latlngs = coords.map((coord) => L.latLng(coord[1], coord[0]));
    totalArea = getPolygonArea(latlngs);
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) => {
      const coords = polygon[0];
      const latlngs = coords.map((coord) => L.latLng(coord[1], coord[0]));
      totalArea += getPolygonArea(latlngs);
    });
  }

  return totalArea;
};

const isValidGeoJsonGeometry = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined
): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon => {
  if (!geometry) return false;
  if (!geometry.type || !geometry.coordinates) return false;
  if (geometry.type === "Polygon")
    return (
      Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0
    );
  if (geometry.type === "MultiPolygon")
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.every(
        (poly) => Array.isArray(poly) && poly.length > 0
      )
    );
  return false;
};

// Generate AOI name based on type and index
const generateAoiName = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  index: number
): string => {
  const type = geometry.type === "Polygon" ? "Polygon" : "Multi-Polygon";
  return `AOI ${type} #${index}`;
};

// Determine if geometry is likely a rectangle
const isRectangle = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): boolean => {
  if (geometry.type !== "Polygon") return false;
  const coords = geometry.coordinates[0];
  return coords.length === 5; // Rectangle has 5 coordinates (first and last are same)
};

export const useAoiLayer = ({
  map,
  aois,
  onCreate,
  onEdit,
  onDelete,
  onSelect,
  previewAoiId,
  autoAddToCart = true,
}: UseAoiLayerProps) => {
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const tooltipRef = useRef<HTMLElement | null>(null);
  const dispatch = useDispatch();

  // Get cart items from Redux store
  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const [autoAddEnabled, setAutoAddEnabled] = useState(autoAddToCart);

  // Add feature group to map
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);
    return () => {
      map.removeLayer(drawnItems);
    };
  }, [map]);

  // Initialize draw control
  useEffect(() => {
    if (!drawControlRef.current) {
      const drawControl = new L.Control.Draw({
        position: "topleft",
        draw: {
          polygon: {
            shapeOptions: {
              color: "blue",
              weight: 2,
              fillOpacity: 0.2,
            },
            allowIntersection: false,
            showArea: false,
          },
          rectangle: {
            shapeOptions: {
              color: "blue",
              weight: 2,
              fillOpacity: 0.2,
            },
          },
          polyline: false,
          circle: false,
          circlemarker: false,
          marker: false,
        },
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true,
        },
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;
    }

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };
  }, [map]);

  // Enhanced tooltip logic for drawing
  useEffect(() => {
    let drawing = false;
    let mouseMoveHandler: (ev: MouseEvent) => void = () => {};

    function showTooltip(text: string, event: MouseEvent) {
      if (!tooltipRef.current) {
        tooltipRef.current = createTooltip();
      }
      tooltipRef.current.innerHTML = text;
      tooltipRef.current.style.left = event.clientX + 15 + "px";
      tooltipRef.current.style.top = event.clientY + 15 + "px";
      tooltipRef.current.style.display = "block";
    }

    function hideTooltip() {
      removeTooltip(tooltipRef.current);
      tooltipRef.current = null;
    }

    function onDrawStart() {
      drawing = true;
      mouseMoveHandler = (ev: MouseEvent) => {
        if (!drawing) return;
        const autoText = autoAddEnabled
          ? "<div style='color: #10b981; font-size: 10px;'>✓ Will auto-add to cart</div>"
          : "<div style='color: #6b7280; font-size: 10px;'>Manual cart management</div>";
        showTooltip(`<div>Start drawing AOI...</div>${autoText}`, ev);
      };
      document.addEventListener("mousemove", mouseMoveHandler);
    }

    const drawVertexHandler = (event: L.LeafletEvent) => {
      if (!drawing) return;
      const e = event as L.DrawEvents.DrawVertex;
      const latlngs: L.LatLng[] =
        e.layer && (e.layer as L.Polygon).getLatLngs
          ? ((e.layer as L.Polygon).getLatLngs()[0] as L.LatLng[])
          : [];

      let area = 0;
      if (latlngs && latlngs.length > 2) {
        area = getPolygonArea(latlngs);
      }

      if (latlngs.length > 0) {
        const coordinates = latlngs
          .map((ll) => `[${ll.lat.toFixed(4)}, ${ll.lng.toFixed(4)}]`)
          .slice(0, 3)
          .join(", ");

        const txt =
          latlngs.length > 2
            ? `<div><strong>Area:</strong> ${formatArea(area)}</div>
             <div><strong>Points:</strong> ${latlngs.length}</div>
             <div style='font-size: 10px; color: #9ca3af;'>Coords: ${coordinates}${
                latlngs.length > 3 ? "..." : ""
              }</div>`
            : `<div><strong>Points:</strong> ${latlngs.length}</div>
             <div style='font-size: 10px; color: #9ca3af;'>Coords: ${coordinates}</div>`;

        document.addEventListener(
          "mousemove",
          function handler(ev: MouseEvent) {
            showTooltip(txt, ev);
            document.removeEventListener("mousemove", handler);
          }
        );
      }
    };

    function onDrawStop() {
      drawing = false;
      hideTooltip();
      document.removeEventListener("mousemove", mouseMoveHandler);
    }

    map.on(L.Draw.Event.DRAWSTART, onDrawStart);
    map.on(L.Draw.Event.DRAWVERTEX, drawVertexHandler);
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop);
    map.on(L.Draw.Event.CREATED, onDrawStop);

    return () => {
      map.off(L.Draw.Event.DRAWSTART, onDrawStart);
      map.off(L.Draw.Event.DRAWVERTEX, drawVertexHandler);
      map.off(L.Draw.Event.DRAWSTOP, onDrawStop);
      map.off(L.Draw.Event.CREATED, onDrawStop);
      hideTooltip();
      document.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [map, autoAddEnabled]);

  // Handle CREATE, EDIT, DELETE events with cart integration
  useEffect(() => {
    const drawnItems = drawnItemsRef.current;

    const handleCreated = async (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Created;
      if (!e.layer || !e.layerType) return;

      const layer = e.layer;
      drawnItems.addLayer(layer);

      if (e.layerType !== "polygon" && e.layerType !== "rectangle") return;

      if (layer instanceof L.Polygon) {
        const geoJson = layer.toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;

        if (isValidGeoJsonGeometry(geoJson)) {
          const area = calculateAreaFromGeometry(geoJson);

          // Call the onCreate callback first
          onCreate(geoJson, area);

          // Auto-add to cart if enabled
          if (autoAddEnabled) {
            // Create a temporary AOI cart item
            const newAoiCartItem: AoiCartItem = {
              id: Date.now(), // Temporary ID - should be replaced with actual ID from backend
              name: generateAoiName(geoJson, aois.length + 1),
              geometry: geoJson,
              area: area,
              coordinates: formatCoordinates(geoJson),
              type: isRectangle(geoJson) ? "Rectangle" : geoJson.type,
              is_active: true,
              monitoring_enabled: false,
              created_at: new Date(),
              addedToCartAt: new Date(),
              description: `Auto-generated AOI with area ${formatArea(area)}`,
              tags: ["auto-generated", e.layerType],
            };

            dispatch(addAoiToCart(newAoiCartItem));

            toast.success(
              `AOI created and added to cart! Area: ${formatArea(area)}`,
              {
                style: { background: "#1f2937", color: "#fff" },
                icon: "🗺️",
                duration: 3000,
              }
            );
          } else {
            toast.success(`AOI created! Area: ${formatArea(area)}`, {
              style: { background: "#1f2937", color: "#fff" },
              icon: "✅",
              duration: 2000,
            });
          }

          console.log("Created AOI:", {
            geometry: geoJson,
            area: formatArea(area),
            coordinates: formatCoordinates(geoJson),
          });
        }
      }
    };

    const handleEdited = (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Edited;
      e.layers.eachLayer((layer: L.Layer) => {
        if (!(layer instanceof L.Polygon)) return;

        const geoJson = layer.toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;

        if (!isValidGeoJsonGeometry(geoJson)) return;

        const area = calculateAreaFromGeometry(geoJson);
        const matchedAoi = aois.find(
          (aoi) => JSON.stringify(aoi.geometry) === JSON.stringify(geoJson)
        );

        if (matchedAoi?.id) {
          onEdit(matchedAoi.id, geoJson, area);

          toast.success(`AOI updated! New area: ${formatArea(area)}`, {
            style: { background: "#1f2937", color: "#fff" },
            icon: "✏️",
            duration: 2000,
          });

          console.log("Edited AOI:", {
            id: matchedAoi.id,
            geometry: geoJson,
            area: formatArea(area),
            coordinates: formatCoordinates(geoJson),
          });
        }
      });
    };

    const handleDeleted = (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Deleted;
      e.layers.eachLayer((layer: L.Layer) => {
        if (!(layer instanceof L.Polygon)) return;

        const geoJson = layer.toGeoJSON().geometry as
          | GeoJSON.Polygon
          | GeoJSON.MultiPolygon;

        if (!isValidGeoJsonGeometry(geoJson)) return;

        const matchedAoi = aois.find(
          (aoi) => JSON.stringify(aoi.geometry) === JSON.stringify(geoJson)
        );

        if (matchedAoi?.id) {
          // Remove from cart if it exists there
          const isInCart = cartItems.some((item) => item.id === matchedAoi.id);
          if (isInCart) {
            dispatch(removeAoiFromCart(matchedAoi.id));
          }

          onDelete(matchedAoi.id);

          toast.success(
            `AOI deleted${isInCart ? " and removed from cart" : ""}`,
            {
              style: { background: "#1f2937", color: "#fff" },
              icon: "🗑️",
              duration: 2000,
            }
          );

          console.log("Deleted AOI:", matchedAoi.id);
        }
      });
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
    };
  }, [
    map,
    aois,
    onCreate,
    onEdit,
    onDelete,
    dispatch,
    cartItems,
    autoAddEnabled,
  ]);

  // Enhanced render AOIs with cart integration
  useEffect(() => {
    drawnItemsRef.current.clearLayers();

    aois.forEach((aoi) => {
      if (!isValidGeoJsonGeometry(aoi.geometry)) {
        console.error("Invalid GeoJSON for AOI:", aoi);
        return;
      }

      const isInCart = cartItems.some((item) => item.id === aoi.id);
      const isPreview = aoi.id === previewAoiId;

      // Enhanced styling based on status
      let color = "gray";
      let weight = 2;
      let dashArray: string | undefined = undefined;

      if (isPreview) {
        color = "red";
        weight = 3;
      } else if (isInCart) {
        color = "#10b981"; // Green for cart items
        weight = 3;
        dashArray = "10,5";
      } else if (aoi.is_active) {
        color = "limegreen";
      }

      const layer = L.geoJSON(aoi.geometry, {
        style: {
          color,
          weight,
          fillOpacity: aoi.monitoring_enabled ? 0.4 : 0.2,
          dashArray,
        },
      });

      // Add click handler for cart toggle and selection
      if (aoi.id !== undefined) {
        layer.on("click", (e) => {
          L.DomEvent.stopPropagation(e);

          // Toggle cart status
          if (isInCart) {
            dispatch(removeAoiFromCart(aoi.id!));
            toast.success(`${aoi.name || `AOI #${aoi.id}`} removed from cart`, {
              style: { background: "#1f2937", color: "#fff" },
              icon: "➖",
            });
          } else {
            const area = calculateAreaFromGeometry(aoi.geometry);
            const cartItem: AoiCartItem = {
              id: aoi.id!,
              name: aoi.name || generateAoiName(aoi.geometry, aoi.id!),
              geometry: aoi.geometry,
              area,
              coordinates: formatCoordinates(aoi.geometry),
              type: isRectangle(aoi.geometry) ? "Rectangle" : aoi.geometry.type,
              is_active: aoi.is_active,
              monitoring_enabled: aoi.monitoring_enabled,
              created_at: aoi.created_at || new Date(),
              addedToCartAt: new Date(),
              description: aoi.description,
              tags: aoi.tags,
            };

            dispatch(addAoiToCart(cartItem));
            toast.success(`${cartItem.name} added to cart!`, {
              style: { background: "#1f2937", color: "#fff" },
              icon: "➕",
            });
          }

          onSelect(aoi.id!);
        });

        // Enhanced popup with cart integration
        const area = calculateAreaFromGeometry(aoi.geometry);
        const coordinates = formatCoordinates(aoi.geometry);
        const popupContent = `
          <div style="min-width: 250px; font-family: system-ui;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <h4 style="margin: 0; color: #1f2937;">${
                aoi.name || `AOI #${aoi.id}`
              }</h4>
              <span style="
                background: ${isInCart ? "#10b981" : "#6b7280"};
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
              ">
                ${isInCart ? "IN CART" : "NOT IN CART"}
              </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <strong style="font-size: 12px; color: #6b7280;">Status:</strong>
                <div style="font-size: 13px; color: ${
                  aoi.is_active ? "#10b981" : "#ef4444"
                };">
                  ${aoi.is_active ? "● Active" : "● Inactive"}
                </div>
              </div>
              <div>
                <strong style="font-size: 12px; color: #6b7280;">Monitoring:</strong>
                <div style="font-size: 13px; color: ${
                  aoi.monitoring_enabled ? "#3b82f6" : "#6b7280"
                };">
                  ${aoi.monitoring_enabled ? "● Enabled" : "● Disabled"}
                </div>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <strong style="font-size: 12px; color: #6b7280;">Area:</strong>
              <div style="font-size: 14px; font-weight: 600; color: #1f2937;">
                ${formatArea(area)}
              </div>
            </div>

            <details style="margin-bottom: 12px;">
              <summary style="font-size: 12px; color: #6b7280; cursor: pointer;">
                <strong>Coordinates</strong>
              </summary>
              <div style="
                font-family: monospace;
                font-size: 10px;
                background: #f3f4f6;
                padding: 8px;
                border-radius: 4px;
                margin-top: 4px;
                max-height: 60px;
                overflow-y: auto;
                word-break: break-all;
              ">
                ${coordinates}
              </div>
            </details>

            <button onclick="window.toggleAoiCart_${aoi.id}()" style="
              background: ${isInCart ? "#ef4444" : "#10b981"};
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              width: 100%;
              font-weight: 600;
              font-size: 13px;
            ">
              ${isInCart ? "Remove from Cart" : "Add to Cart"}
            </button>
          </div>
        `;

        layer.bindPopup(popupContent);

        // Global function for cart toggle from popup
        (window as unknown as Window & { [key: string]: unknown })[
          `toggleAoiCart_${aoi.id}`
        ] = () => {
          if (isInCart) {
            dispatch(removeAoiFromCart(aoi.id!));
            toast.success("Removed from cart", { icon: "➖" });
          } else {
            const area = calculateAreaFromGeometry(aoi.geometry);
            const cartItem: AoiCartItem = {
              id: aoi.id!,
              name: aoi.name || generateAoiName(aoi.geometry, aoi.id!),
              geometry: aoi.geometry,
              area,
              coordinates: formatCoordinates(aoi.geometry),
              type: isRectangle(aoi.geometry) ? "Rectangle" : aoi.geometry.type,
              is_active: aoi.is_active,
              monitoring_enabled: aoi.monitoring_enabled,
              created_at: aoi.created_at || new Date(),
              addedToCartAt: new Date(),
              description: aoi.description,
              tags: aoi.tags,
            };
            dispatch(addAoiToCart(cartItem));
            toast.success("Added to cart!", { icon: "➕" });
          }
        };
      }

      drawnItemsRef.current.addLayer(layer);
    });
  }, [aois, onSelect, previewAoiId, cartItems, dispatch]);

  // Drawing functions
  const startPolygon = useCallback(() => {
    if (!map) return;
    const drawer = new L.Draw.Polygon(map as unknown as L.DrawMap, {
      shapeOptions: {
        color: "blue",
        weight: 2,
        fillOpacity: 0.2,
      },
      allowIntersection: false,
      showArea: false,
    });
    drawer.enable();
  }, [map]);

  const startRectangle = useCallback(() => {
    if (!map) return;
    const drawer = new L.Draw.Rectangle(map as unknown as L.DrawMap, {
      shapeOptions: {
        color: "blue",
        weight: 2,
        fillOpacity: 0.2,
      },
    });
    drawer.enable();
  }, [map]);

  // Cart management functions
  const toggleAutoAddToCart = useCallback(() => {
    setAutoAddEnabled((prev) => {
      const newValue = !prev;
      toast.success(`Auto-add to cart ${newValue ? "enabled" : "disabled"}`, {
        style: { background: "#1f2937", color: "#fff" },
        icon: newValue ? "🔄" : "⏸️",
      });
      return newValue;
    });
  }, []);

  const addAllToCart = useCallback(() => {
    let addedCount = 0;
    aois.forEach((aoi) => {
      if (aoi.id && !cartItems.some((item) => item.id === aoi.id)) {
        const area = calculateAreaFromGeometry(aoi.geometry);
        const cartItem: AoiCartItem = {
          id: aoi.id,
          name: aoi.name || generateAoiName(aoi.geometry, aoi.id),
          geometry: aoi.geometry,
          area,
          coordinates: formatCoordinates(aoi.geometry),
          type: isRectangle(aoi.geometry) ? "Rectangle" : aoi.geometry.type,
          is_active: aoi.is_active,
          monitoring_enabled: aoi.monitoring_enabled,
          created_at: aoi.created_at || new Date(),
          addedToCartAt: new Date(),
          description: aoi.description,
          tags: aoi.tags,
        };
        dispatch(addAoiToCart(cartItem));
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} AOIs to cart`, {
        style: { background: "#1f2937", color: "#fff" },
        icon: "📦",
      });
    } else {
      toast("All AOIs are already in cart", { icon: "ℹ️" });
    }
  }, [aois, cartItems, dispatch]);

  const clearCartItems = useCallback(() => {
    const cartAoiIds = cartItems.map((item) => item.id);
    cartAoiIds.forEach((id) => {
      dispatch(removeAoiFromCart(id));
    });
    toast.success("Cart cleared", { icon: "🧹" });
  }, [cartItems, dispatch]);

  return {
    drawnItemsRef,
    startPolygon,
    startRectangle,
    autoAddToCart: autoAddEnabled,
    toggleAutoAddToCart,
    addAllToCart,
    clearCart: clearCartItems,
    cartItemCount: cartItems.length,
    cartItems: cartItems,
    formatArea,
    formatCoordinates,
  };
};
