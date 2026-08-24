/**
 * VehicleMap — Carte Mapbox affichant les véhicules.
 *
 * Utilise Mapbox GL JS (free tier : 50k req/mois).
 * Affiche les véhicules avec clustering et markers personnalisés.
 */

import { useEffect, useRef, useState } from "react";

interface VehicleMarker {
  id: string;
  brand: string;
  model: string;
  dailyRentalPriceGnf: number | null;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  commune: string;
  boostLevel?: string | null;
}

interface VehicleMapProps {
  vehicles: VehicleMarker[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  height?: string;
  onVehicleClick?: (vehicleId: string) => void;
  showUserLocation?: boolean;
}

export function VehicleMap({
  vehicles,
  center = [-13.6929, 9.6412], // Conakry par défaut
  zoom = 12,
  height = "400px",
  onVehicleClick,
}: VehicleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [mapError, setMapError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;

    // Charger Mapbox dynamiquement
    import("mapbox-gl").then((mapboxgl) => {
      mapboxgl.default.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom,
      });

      map.on("load", () => {
        setIsLoaded(true);

        // Ajouter la source de données avec clustering
        map.addSource("vehicles", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: vehicles.map((v) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [v.longitude, v.latitude],
              },
              properties: {
                id: v.id,
                brand: v.brand,
                model: v.model,
                price: v.dailyRentalPriceGnf,
                commune: v.commune,
                boostLevel: v.boostLevel,
              },
            })),
          },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // Cercles de cluster
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "vehicles",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": ["step", ["get", "point_count"], "#51bbd6", 10, "#f1f075", 30, "#f28cb1"],
            "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
          },
        });

        // Compteur de cluster
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "vehicles",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
          },
        });

        // Markers individuels
        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "vehicles",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "match",
              ["get", "boostLevel"],
              "VIP", "#8b5cf6",
              "PREMIUM", "#f59e0b",
              "#3b82f6",
            ],
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });

        // Popup au clic sur un marker
        const popup = new mapboxgl.default.Popup({
          closeButton: false,
          closeOnClick: true,
        });

        map.on("click", "unclustered-point", (e: any) => {
          const feature = e.features?.[0];
          if (!feature) return;

          const { brand, model, price, commune, id } = feature.properties;
          const coordinates = (e as any).lngLat;

          popup
            .setLngLat(coordinates)
            .setHTML(
              `<div style="min-width:180px;padding:8px">
                <strong>${brand} ${model}</strong>
                <p style="margin:4px 0;color:#666;font-size:12px">📍 ${commune}</p>
                ${price ? `<p style="margin:4px 0;color:#3b82f6;font-weight:bold">${price.toLocaleString()} GNF/jour</p>` : ""}
                ${onVehicleClick ? `<button onclick="window.__vehicleClick('${id}')" style="margin-top:4px;padding:4px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer">Voir détails</button>` : ""}
              </div>`
            )
            .addTo(map);
        });

        // Clic sur cluster → zoom
        map.on("click", "clusters", (e: any) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const clusterId = feature.properties?.cluster_id;
          const source = map.getSource("vehicles") as any;
          source?.getClusterExpansionZoom(clusterId, (err: Error, zoom: number) => {
            if (err) return;
            map.easeTo({ center: (e as any).lngLat, zoom });
          });
        });

        mapRef.current = map;
      });

      map.on("error", () => setMapError(true));
    }).catch(() => setMapError(true));

    return () => {
      if (mapRef.current) {
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
  }, [MAPBOX_TOKEN, vehicles, center, zoom, onVehicleClick]);

  // Expose la fonction de clic globalement
  useEffect(() => {
    if (onVehicleClick) {
      (window as any).__vehicleClick = (id: string) => onVehicleClick(id);
    }
    return () => {
      delete (window as any).__vehicleClick;
    };
  }, [onVehicleClick]);

  if (!MAPBOX_TOKEN || mapError) {
    return (
      <div
        style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", borderRadius: "8px" }}
        className="text-gray-500"
      >
        <div className="text-center p-4">
          <p className="text-lg mb-1">🗺️</p>
          <p className="text-sm">Carte non disponible</p>
          <p className="text-xs mt-1 text-gray-400">
            {!MAPBOX_TOKEN ? "Token Mapbox non configuré" : "Erreur de chargement"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: "8px", overflow: "hidden" }} className="relative">
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Chargement de la carte...</p>
        </div>
      )}
    </div>
  );
}
