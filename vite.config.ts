/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "SnapMemory — Iris, la tua memoria personale",
        short_name: "SnapMemory",
        description: "Uno scatto al giorno. Iris lo trasforma in un ricordo. Privato, calmo, tuo.",
        theme_color: "#08080A",
        background_color: "#08080A",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "Scatta un ricordo",
            short_name: "Scatta",
            url: "/?action=capture",
            icons: [{ src: "icons/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Chiedi a Iris",
            short_name: "Cerca",
            url: "/?action=search",
            icons: [{ src: "icons/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
