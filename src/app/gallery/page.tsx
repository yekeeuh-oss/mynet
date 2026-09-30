import type { Metadata } from "next";
import { GalleryScreen } from "@/components/gallery/gallery-screen";
import "./script-font.css";

export const metadata: Metadata = {
  title: "光影画廊 · 纸间",
  description: "随手拍下的光影，和压在照片上的一句感想。",
};

export default function GalleryPage() {
  return <GalleryScreen />;
}
