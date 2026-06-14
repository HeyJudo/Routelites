/**
 * Brand canvas map style for RouteLite.
 * Desaturated light "sage-green" canvas so the teal (#00796b) route
 * polyline reads as the highest-contrast element on every map.
 *
 * Rules:
 *  - Landscape/water: soft sage greens harmonising with background #f3faf7
 *  - Roads: white/very-light-gray fills, subtle strokes — no yellow/orange
 *  - POI icons+labels: off
 *  - Transit: off
 *  - Road/admin labels: kept but muted
 *  - No purple or blue defaults
 */
export const mapStyle = [
  // ── Global geometry ─────────────────────────────────────────────────────────
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ saturation: -40 }, { lightness: 5 }],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6d7a76" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },

  // ── Landscape ───────────────────────────────────────────────────────────────
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#eef2f0" }],
  },
  {
    featureType: "landscape.natural.terrain",
    elementType: "geometry",
    stylers: [{ color: "#e4ece8" }],
  },

  // ── Parks / green areas ──────────────────────────────────────────────────────
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#dcebe3" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },

  // ── Water ────────────────────────────────────────────────────────────────────
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#cfe3dd" }],
  },
  {
    featureType: "water",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },

  // ── Roads ────────────────────────────────────────────────────────────────────
  // Local roads
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0e7e4" }, { weight: 1 }],
  },
  // Arterial roads
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#f7f9f8" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0e7e4" }, { weight: 1 }],
  },
  // Highways — slightly warmer gray
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#e8ecea" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d4dcd8" }, { weight: 1 }],
  },
  // Road labels — muted
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a9692" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },

  // ── Administrative / locality labels ─────────────────────────────────────────
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6d7a76" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6d7a76" }],
  },

  // ── POI — hide all icons and labels ──────────────────────────────────────────
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },

  // ── Transit — hide ────────────────────────────────────────────────────────────
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
];
