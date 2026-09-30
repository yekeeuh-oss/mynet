"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "日记" },
  { href: "/gallery", label: "光影画廊" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex flex-wrap gap-2" aria-label="站点">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex h-10 items-center rounded-full bg-[#1E6B48] px-4 text-sm font-medium text-[#FAF9F6] transition-all duration-300"
                : "inline-flex h-10 items-center rounded-full border border-white/20 bg-white/55 px-4 text-sm text-[#241f1b] shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/75"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
