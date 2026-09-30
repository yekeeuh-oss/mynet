import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "纸间 · 个人日记",
    short_name: "纸间",
    description: "磨砂玻璃便当盒上的私人日记与光影画廊。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#10241f",
    theme_color: "#1E6B48",
    lang: "zh-CN",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
