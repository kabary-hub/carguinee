import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "CarGuinée",
        short_name: "CarGuinée",
        description: "Plateforme de vente et location de véhicules à Conakry.",
        theme_color: "#0f172a",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/",
        scope: "/"
      }
    })
  ],
  server: {
    allowedHosts: [".manus.computer"]
  }
});
