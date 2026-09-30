"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/config";
import { getMedia, isMediaRef, mediaIdFromRef } from "@/lib/media-db";

export function useResolvedAsset(reference: string) {
  const [href, setHref] = useState<string>(siteConfig.defaultBackground);

  useEffect(() => {
    let cancelled = false;
    const target = reference.trim();
    if (!target) {
      setHref(siteConfig.defaultBackground);
      return () => {
        cancelled = true;
      };
    }
    if (target.startsWith("data:image/")) {
      setHref(target);
      return () => {
        cancelled = true;
      };
    }
    if (isMediaRef(target)) {
      void getMedia(mediaIdFromRef(target)).then((value) => {
        if (!cancelled) setHref(value || siteConfig.defaultBackground);
      });
      return () => {
        cancelled = true;
      };
    }
    setHref(target);
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return href;
}
