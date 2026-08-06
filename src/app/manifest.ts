import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA: hace la app instalable en la pantalla de inicio.
 * Los colores coinciden con los tokens del sistema de diseño.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nerd — universidad y entrenamiento",
    short_name: "nerd",
    description: "Tu horario, tus faltas, tus pendientes y tu entrenamiento en un solo lugar.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfdfd",
    theme_color: "#fdfdfd",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
