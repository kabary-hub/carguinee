/**
 * VehicleMap — Carte Leaflet/OpenStreetMap affichant les véhicules.
 *
 * Solution 100% gratuite sans token API ni carte bancaire.
 * Utilise OpenStreetMap tiles et Leaflet pour l'interaction.
 */

import { useEffect, useRef } from "react";

interface VehicleMarker {
  id: string;
  brand: string;
  model: string;
  dailyRentalPriceGnf: number | null;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  commune: string;
}

interface VehicleMapProps {
  vehicles: VehicleMarker[];
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  height?: string;
  onVehicleClick?: (vehicleId: string) => void;
}

/**
 * Convertit un prix GNF en format lisible
 */
function formatPrice(price: number | null): string {
  if (!price) return "";
  return price.toLocaleString("fr-FR") + " GNF";
}

function createVehiclePopup(v: VehicleMarker): string {
  return `
    <div style="min-width:180px;font-family:system-ui,sans-serif;">
      ${v.photoUrl ? `<img src="${v.photoUrl}" alt="${v.brand} ${v.model}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />` : ""}
      <strong style="font-size:14px;">${v.brand} ${v.model}</strong>
      <p style="margin:4px 0;color:#666;font-size:12px;">${v.commune}</p>
      ${v.dailyRentalPriceGnf ? `<p style="margin:4px 0;color:#059669;font-weight:bold;font-size:13px;">${formatPrice(v.dailyRentalPriceGnf)}/jour</p>` : ""}
    </div>
  `;
}

export function VehicleMap({
  vehicles,
  center = [9.6412, -13.6929], // Conakry, Guinée
  zoom = 12,
  height = "400px",
  onVehicleClick,
}: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Import dynamique de Leaflet côté client uniquement
    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(([leaflet]) => {
        const L = leaflet.default || leaflet;

        // Créer la carte
        const map = L.map(mapRef.current!, {
          center,
          zoom,
          scrollWheelZoom: false,
        });

        // Ajouter les tiles OpenStreetMap (gratuites)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Style du marker personnalisé
        const createIcon = (color: string) =>
          L.divIcon({
            className: "custom-marker",
            html: `<div style="
              width: 28px; height: 28px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              display: flex; align-items: center; justify-content: center;
              font-size: 14px; color: white; font-weight: bold;
            ">V</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -16],
          });

        const defaultIcon = createIcon("#3b82f6");

        // Grouper les véhicules par coordonnées pour créer des clusters
        const markers = L.featureGroup();
        const grouped: Record<string, VehicleMarker[]> = {};

        vehicles.forEach((v) => {
          if (!v.latitude || !v.longitude) return;
          const key = `${v.latitude},${v.longitude}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(v);
        });

        Object.values(grouped).forEach((group) => {
          const first = group[0];
          const count = group.length;

          if (count === 1) {
            // Un seul véhicule → marker simple
            const marker = L.marker([first.latitude, first.longitude], { icon: defaultIcon });
            marker.bindPopup(createVehiclePopup(first));
            markers.addLayer(marker);
          } else {
            // Plusieurs véhicules → cluster avec badge compteur
            const clusterIcon = L.divIcon({
              className: "custom-cluster",
              html: `<div style="
                width: 42px; height: 42px;
                background: linear-gradient(135deg, #059669, #10b981);
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                display: flex; align-items: center; justify-content: center;
                font-size: 16px; color: white; font-weight: 900;
                cursor: pointer;
              ">${count}</div>`,
              iconSize: [42, 42],
              iconAnchor: [21, 21],
              popupAnchor: [0, -24],
            });

            const marker = L.marker([first.latitude, first.longitude], { icon: clusterIcon });

            // Popup listant tous les véhicules du cluster
            const popupHtml = group
              .map((v) => `
                <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;font-family:system-ui,sans-serif;">
                  <span style="font-size:20px;">V</span>
                  <div style="flex:1;min-width:0;">
                    <strong style="font-size:13px;">${v.brand} ${v.model}</strong>
                    <p style="margin:2px 0;color:#666;font-size:11px;">${v.commune}</p>
                    ${v.dailyRentalPriceGnf ? `<p style="margin:0;color:#059669;font-weight:bold;font-size:12px;">${formatPrice(v.dailyRentalPriceGnf)}/jour</p>` : ""}
                  </div>
                  ${onVehicleClick ? `<button onclick="window.__vehicleClick('${v.id}')" style="shrink:0;padding:4px 10px;background:#059669;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">Voir</button>` : ""}
                </div>
              `)
              .join("");

            marker.bindPopup(`<div style="min-width:220px;max-height:300px;overflow-y:auto;"><p style="font-weight:900;font-size:14px;margin:0 0 6px 0;font-family:system-ui,sans-serif;">${count} véhicules ici</p>${popupHtml}</div>`);
            markers.addLayer(marker);
          }
        });

        markers.addTo(map);

        // Centrer sur les markers s'il y en a
        if (vehicles.length > 0) {
          try {
            map.fitBounds(markers.getBounds().pad(0.1));
          } catch {
            // Ignore si les bounds sont vides
          }
        }

        mapInstanceRef.current = map;
      })
      .catch(() => {
        // Erreur de chargement — silencieux
      });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [vehicles, center, zoom, onVehicleClick]);

  // Expose la fonction de clic globalement
  useEffect(() => {
    if (onVehicleClick) {
      (window as unknown as Record<string, unknown>).__vehicleClick = (id: string) =>
        onVehicleClick(id);
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).__vehicleClick;
    };
  }, [onVehicleClick]);

  return (
    <div
      style={{ height, borderRadius: "12px", overflow: "hidden" }}
      className="relative border border-slate-200 dark:border-slate-700"
    >
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
