"use client";
import dynamic from "next/dynamic";
import "maplibre-gl/dist/maplibre-gl.css";

// react-map-gl/maplibre must load client-side only (window dependency).
const Map = dynamic(() => import("react-map-gl/maplibre").then((m) => m.default), { ssr: false });

export default function BaseMap({ center, zoom = 12, children, style }) {
  const mapStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://demotiles.maplibre.org/style.json";
  return (
    <Map
      initialViewState={{ longitude: center?.lng ?? -74, latitude: center?.lat ?? 40.7, zoom }}
      style={{ width: "100%", height: 480, borderRadius: 8, ...style }}
      mapStyle={mapStyle}
    >
      {children}
    </Map>
  );
}
