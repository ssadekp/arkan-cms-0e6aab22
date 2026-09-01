import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { Link } from "@tanstack/react-router";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

export interface MapPoint {
  id: string;
  slug: string;
  title: string;
  city: string;
  status: string;
  statusLabel: string;
  focusLabel: string | null;
  image: string | null;
  lat: number;
  lng: number;
}

const STATUS_COLOR: Record<string, string> = {
  planned: "#f59e0b",
  ongoing: "#10b981",
  completed: "#0ea5e9",
};

function pinIcon(status: string) {
  const color = STATUS_COLOR[status] ?? "#10b981";
  return L.divIcon({
    className: "",
    html = "",
    iconSize: [24, 24],
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 9);
    } else {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2));
    }
  }, [map, points]);
  return null;
}

export default function ProjectsMapCanvas({
  points,
  lang,
}: {
  points: MapPoint[];
  lang: "ar" | "en";
}) {
  const icons = useMemo(() => {
    const cache: Record<string, L.DivIcon> = {};
    for (const s of Object.keys(STATUS_COLOR)) cache[s] = pinIcon(s);
    return cache;
  }, []);

  return (
    <MapContainer
      center={[26.8206, 30.8025]}
      zoom={6}
      scrollWheelZoom
      className="h-[70vh] min-h-[420px] w-full rounded-2xl border border-border/60 z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds points={points} />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={icons[p.status] ?? icons.ongoing}>
          <Popup>
            <div className="w-52" dir={lang === "ar" ? "rtl" : "ltr"}>
              {p.image && (
                <img src={p.image} alt="" className="mb-2 h-24 w-full rounded-md object-cover" />
              )}
              <p className="text-sm font-semibold leading-snug">{p.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[p.city, p.focusLabel, p.statusLabel].filter(Boolean).join(" · ")}
              </p>
              <Link
                to="/projects/$slug"
                params={{ slug: p.slug }}
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
              >
                {lang === "ar" ? "تفاصيل المشروع" : "View project"}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
