import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f8f9fa",
    description: "Local-first student life companion",
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/unilife-ai.svg",
        type: "image/svg+xml",
      },
    ],
    name: "UniLife.AI",
    short_name: "UniLife",
    start_url: "/dashboard",
    theme_color: "#0058be",
  };
}

