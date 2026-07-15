import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import LoadingVeil from "./components/LoadingVeil";
import { activityTracker } from "./lib/activityTracker";

import "./index.css";
import "./mobile-performance.css";
import "./luxury-memory.css";

activityTracker.start();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoadingVeil brand="Nafsam" />
    <App />
  </StrictMode>,
);

// Keep the live site network-driven and clear old service-worker caches.
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
