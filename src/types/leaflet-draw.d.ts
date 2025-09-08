import * as L from "leaflet";

declare module "leaflet" {
  namespace Draw {
    class Event {
      static CREATED: "draw:created";
      static EDITED: "draw:edited";
      static DELETED: "draw:deleted";
    }
  }

  namespace DrawEvents {
    interface Created {
      layer: L.Layer;
      layerType: string;
    }
    interface Edited {
      layers: L.LayerGroup;
    }
    interface Deleted {
      layers: L.LayerGroup;
    }
  }
}
