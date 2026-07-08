import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import LoadingVeil from "./components/LoadingVeil";
import "./index.css";
import "./mobile-performance.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoadingVeil brand="Nafsam" />
    <App />
  </StrictMode>,
);

if (
  "serviceWorker" in navigator &&
  import.meta.env.PROD &&
  window.location.protocol === "https:"
) {
  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL || "/";
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch(() => {});
  });
}
