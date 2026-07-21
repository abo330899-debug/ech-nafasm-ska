import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import LoadingVeil from "./components/LoadingVeil";
import "./index.css";
import "./mobile-performance.css";
import "./luxury-memory.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoadingVeil brand="Nafsam" />
    <App />
  </StrictMode>,
);

// The site is media-heavy and private. A service worker can keep old HTML/assets
// alive or take control mid-session, which on mobile may look like a page refresh
// while scrolling. Keep the live site network-driven and clear old SW caches.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      })
      .catch(() => {});

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => {
          keys
            .filter((key) => key.startsWith("nafsam-"))
            .forEach((key) => caches.delete(key).catch(() => {}));
        })
        .catch(() => {});
    }
  });
}
