import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

const isPublishedHttps = window.location.protocol === "https:" && !window.location.hostname.endsWith(".manus.computer");

if ("serviceWorker" in navigator && isPublishedHttps) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The app remains usable online if registration is unavailable.
    });
  });
}
