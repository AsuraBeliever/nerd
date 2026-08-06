"use client";

import { useEffect } from "react";

/** Registra el service worker. Solo en producción: en desarrollo estorba. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Si falla, la app sigue funcionando: el offline es una mejora, no un requisito.
    });
  }, []);

  return null;
}
