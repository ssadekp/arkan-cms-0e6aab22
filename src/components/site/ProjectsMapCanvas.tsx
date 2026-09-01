import { useEffect, useRef } from "react";
import L from "leaflet";
import { useRouter } from "@tanstack/react-router";

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
    html: `<span style="display:block;width:20px;height:20px;border-radius:9999px;background:${color};box-shadow:0 0 0 4px ${color}33,0 2px 6px rgba(0,0,0,.35);border:2px solid #fff"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });
}

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export default function ProjectsMapCanvas({
  points,
  lang,
}: {
  points: MapPoint[];
  lang: "ar" | "en";
}) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const router = useRouter();
  const fitted = useRef(false);

  // init once
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [26.8206, 30.8025], zoom: 6, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  // render markers
  useEffect(() => {
    const m = map.current;
    const lg = layer.current;
    if (!m || !lg) return;
    lg.clearLayers();

    for (const p of points) {
      const marker = L.marker([p.lat, p.lng], { icon: pinIcon(p.status), title: p.title });
      const meta = [p.city, p.focusLabel, p.statusLabel].filter(Boolean).map(esc).join(" · ");
      const html = `
        <div dir="${lang === "ar" ? "rtl" : "ltr"}" style="width:200px">
          ${p.image ? `<img src="${esc(p.image)}" alt="" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:8px" />` : ""}
          <div style="font-weight:700;font-size:14px;line-height:1.35">${esc(p.title)}</div>
          ${meta ? `<div style="font-size:12px;opacity:.7;margin-top:4px">${meta}</div>` : ""}
          <button type="button" data-slug="${esc(p.slug)}" style="margin-top:8px;font-size:12px;font-weight:700;color:#10b981;background:none;border:0;padding:0;cursor:pointer">
            ${lang === "ar" ? "تفاصيل المشروع" : "View project"}
          </button>
        </div>`;
      marker.bindPopup(html);
      marker.on("popupopen", (e: any) => {
        const btn = e.popup.getElement()?.querySelector("button[data-slug]") as HTMLButtonElement | null;
        btn?.addEventListener("click", () => {
          router.navigate({ to: "/projects/$slug", params: { slug: p.slug } });
        });
      });
      lg.addLayer(marker);
    }

    if (!fitted.current && points.length > 0) {
      fitted.current = true;
      if (points.length === 1) m.setView([points[0].lat, points[0].lng], 9);
      else m.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2));
    }
  }, [points, lang, router]);

  return <div ref={el} className="h-[70vh] min-h-[420px] w-full rounded-2xl border border-border/60 z-0" />;
}
