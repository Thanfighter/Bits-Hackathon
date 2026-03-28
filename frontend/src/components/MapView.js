import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ROUTE_COLORS = {
  green: "#00C853",
  yellow: "#FFD600",
  red: "#FF3B30",
};

export default function MapView({ route, decisionColor = "green" }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !route) return;

    // Clean up previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Grayscale tiles (CartoDB Positron)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
    }).addTo(map);

    const originLatLng = L.latLng(route.origin_coords[0], route.origin_coords[1]);
    const destLatLng = L.latLng(route.dest_coords[0], route.dest_coords[1]);

    // Route line
    const routeColor = ROUTE_COLORS[decisionColor] || ROUTE_COLORS.green;

    // Create curved route points
    const midLat = (originLatLng.lat + destLatLng.lat) / 2;
    const midLng = (originLatLng.lng + destLatLng.lng) / 2;
    const offsetLat = (destLatLng.lng - originLatLng.lng) * 0.15;

    const curvePoints = [
      originLatLng,
      L.latLng(midLat + offsetLat, midLng),
      destLatLng,
    ];

    L.polyline(curvePoints, {
      color: routeColor,
      weight: 3,
      opacity: 0.9,
      dashArray: "8 6",
    }).addTo(map);

    // Origin marker
    const originIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#09090B;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    // Destination marker
    const destIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:${routeColor};border:2px solid white;box-shadow:0 0 8px ${routeColor}40;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    L.marker(originLatLng, { icon: originIcon })
      .addTo(map)
      .bindTooltip(route.origin_port?.replace(/_/g, " ").toUpperCase(), {
        permanent: true,
        direction: "top",
        offset: [0, -10],
        className: "!bg-zinc-950 !text-white !text-[10px] !font-mono !tracking-widest !font-bold !border-0 !rounded-none !px-2 !py-1 !shadow-none",
      });

    L.marker(destLatLng, { icon: destIcon })
      .addTo(map)
      .bindTooltip(route.dest_port?.replace(/_/g, " ").toUpperCase(), {
        permanent: true,
        direction: "top",
        offset: [0, -10],
        className: "!bg-zinc-950 !text-white !text-[10px] !font-mono !tracking-widest !font-bold !border-0 !rounded-none !px-2 !py-1 !shadow-none",
      });

    // Fit bounds
    const bounds = L.latLngBounds([originLatLng, destLatLng]);
    map.fitBounds(bounds, { padding: [60, 60] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [route, decisionColor]);

  if (!route) return null;

  return (
    <div className="border border-zinc-200 bg-white" data-testid="map-view">
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
        <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
          ROUTE VISUALIZATION
        </span>
        <span className="text-xs font-mono text-zinc-400">
          {route.origin_port?.replace(/_/g, " ")} → {route.dest_port?.replace(/_/g, " ")}
        </span>
      </div>
      <div
        ref={mapRef}
        className="w-full h-[300px] md:h-[400px]"
        data-testid="map-container"
      />
    </div>
  );
}
