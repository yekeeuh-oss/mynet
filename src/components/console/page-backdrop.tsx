"use client";

import { siteConfig } from "@/lib/config";
import { cssImage } from "@/lib/url";
import { useAppChrome } from "@/components/console/app-chrome";

export function PageBackdrop({ image }: { image: string }) {
  const { theme } = useAppChrome();
  const light = theme === "light";

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 bg-cover bg-center transition-all duration-300"
      style={{
        backgroundColor: light ? "#FAF9F6" : "#10241f",
        backgroundImage: light ? "none" : cssImage(image || siteConfig.defaultBackground),
      }}
    />
  );
}
