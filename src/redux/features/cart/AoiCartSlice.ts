import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// AOI-specific cart item interface
export interface AoiCartItem {
  id: number;
  name: string; // e.g., "AOI #1", "Agricultural Zone", etc.
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  area: number; // in square meters
  coordinates: string; // formatted coordinate string
  type: "Polygon" | "MultiPolygon" | "Rectangle";
  is_active: boolean;
  monitoring_enabled: boolean;
  created_at: string; // ISO string for serialization
  addedToCartAt: string; // ISO string for serialization
  // Optional metadata
  description?: string;
  tags?: string[];
  color?: string;
}

interface AoiCartState {
  items: AoiCartItem[];
  totalArea: number; // Total area of all AOIs in cart
  totalCount: number; // Total number of AOIs in cart
}

const initialState: AoiCartState = {
  items: [],
  totalArea: 0,
  totalCount: 0,
};

const aoiCartSlice = createSlice({
  name: "aoiCart",
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<AoiCartItem[]>) {
      state.items = action.payload;
      state.totalCount = action.payload.length;
      state.totalArea = action.payload.reduce(
        (sum, item) => sum + item.area,
        0
      );
    },

    addAoiToCart(state, action: PayloadAction<AoiCartItem>) {
      const existing = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (!existing) {
        const newItem = {
          ...action.payload,
          addedToCartAt: new Date().toISOString(),
          created_at: new Date(action.payload.created_at).toISOString(),
        };
        state.items.push(newItem);
        state.totalCount += 1;
        state.totalArea += action.payload.area;
      }
    },

    removeAoiFromCart(state, action: PayloadAction<number>) {
      const itemToRemove = state.items.find(
        (item) => item.id === action.payload
      );
      if (itemToRemove) {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.totalCount -= 1;
        state.totalArea -= itemToRemove.area;
      }
    },

    updateAoiInCart(
      state,
      action: PayloadAction<{
        id: number;
        geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
        area?: number;
        coordinates?: string;
        name?: string;
        description?: string;
        tags?: string[];
        monitoring_enabled?: boolean;
        is_active?: boolean;
      }>
    ) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        const oldArea = item.area;

        // Update fields if provided
        if (action.payload.geometry) item.geometry = action.payload.geometry;
        if (action.payload.area !== undefined) {
          item.area = action.payload.area;
          state.totalArea = state.totalArea - oldArea + action.payload.area;
        }
        if (action.payload.coordinates)
          item.coordinates = action.payload.coordinates;
        if (action.payload.name) item.name = action.payload.name;
        if (action.payload.description !== undefined)
          item.description = action.payload.description;
        if (action.payload.tags) item.tags = action.payload.tags;
        if (action.payload.monitoring_enabled !== undefined)
          item.monitoring_enabled = action.payload.monitoring_enabled;
        if (action.payload.is_active !== undefined)
          item.is_active = action.payload.is_active;
      }
    },

    clearAoiCart(state) {
      state.items = [];
      state.totalArea = 0;
      state.totalCount = 0;
    },

    addMultipleAoisToCart(state, action: PayloadAction<AoiCartItem[]>) {
      action.payload.forEach((aoi) => {
        const existing = state.items.find((item) => item.id === aoi.id);
        if (!existing) {
          const newItem = {
            ...aoi,
            addedToCartAt: new Date().toISOString(),
            created_at: new Date(aoi.created_at).toISOString(),
          };
          state.items.push(newItem);
          state.totalCount += 1;
          state.totalArea += aoi.area;
        }
      });
    },

    removeMultipleAoisFromCart(state, action: PayloadAction<number[]>) {
      action.payload.forEach((id) => {
        const itemToRemove = state.items.find((item) => item.id === id);
        if (itemToRemove) {
          state.items = state.items.filter((item) => item.id !== id);
          state.totalCount -= 1;
          state.totalArea -= itemToRemove.area;
        }
      });
    },

    toggleMonitoring(state, action: PayloadAction<number>) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        item.monitoring_enabled = !item.monitoring_enabled;
      }
    },

    toggleActive(state, action: PayloadAction<number>) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        item.is_active = !item.is_active;
      }
    },
  },
});

// Helper selectors
export const selectCartItems = (state: { aoiCart: AoiCartState }) =>
  state.aoiCart.items;
export const selectCartTotalArea = (state: { aoiCart: AoiCartState }) =>
  state.aoiCart.totalArea;
export const selectCartTotalCount = (state: { aoiCart: AoiCartState }) =>
  state.aoiCart.totalCount;
export const selectCartItemById = (
  state: { aoiCart: AoiCartState },
  id: number
) => state.aoiCart.items.find((item) => item.id === id);
export const selectIsInCart = (state: { aoiCart: AoiCartState }, id: number) =>
  state.aoiCart.items.some((item) => item.id === id);

// Utility functions for formatting
export const formatArea = (area: number): string => {
  if (area > 1000000) return `${(area / 1000000).toFixed(2)} km²`;
  if (area > 10000) return `${(area / 10000).toFixed(2)} ha`;
  return `${area.toFixed(2)} m²`;
};

export const formatCoordinates = (
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): string => {
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates[0];
    return coords
      .map((coord) => `[${coord[1].toFixed(6)}, ${coord[0].toFixed(6)}]`)
      .join(", ");
  } else if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map(
        (polygon, idx) =>
          `Polygon ${idx + 1}: ${polygon[0]
            .map((coord) => `[${coord[1].toFixed(6)}, ${coord[0].toFixed(6)}]`)
            .join(", ")}`
      )
      .join(" | ");
  }
  return "";
};

export const {
  setCart,
  addAoiToCart,
  removeAoiFromCart,
  updateAoiInCart,
  clearAoiCart,
  addMultipleAoisToCart,
  removeMultipleAoisFromCart,
  toggleMonitoring,
  toggleActive,
} = aoiCartSlice.actions;

export default aoiCartSlice.reducer;
