"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/config";
import { useResolvedAsset } from "@/lib/use-resolved-asset";
import { ActivityGraph } from "@/components/console/activity-graph";
import { AdminControls } from "@/components/console/admin-controls";
import { PageBackdrop } from "@/components/console/page-backdrop";
import { SiteNav } from "@/components/console/site-nav";
import { CalendarCard } from "@/components/console/cards/calendar-card";
import { DiaryCard } from "@/components/console/cards/diary-card";
import { LoreCard } from "@/components/console/cards/lore-card";
import { NotesCard } from "@/components/console/cards/notes-card";
import { OracleCard } from "@/components/console/cards/oracle-card";
import { PlaygroundCard } from "@/components/console/cards/playground-card";
import { ProfileCard } from "@/components/console/cards/profile-card";
import { RadarCard } from "@/components/console/cards/radar-card";
import { CapsuleCard } from "@/components/console/cards/capsule-card";
import { VinylCard } from "@/components/console/cards/vinyl-card";
import { ConsoleProvider, useConsole } from "@/components/console/console-context";

export function BentoDashboard() {
  return (
    <ConsoleProvider>
      <ConsoleScreen />
    </ConsoleProvider>
  );
}

function ConsoleScreen() {
  const { ready, settings } = useConsole();
  const [liveBackground, setLiveBackground] = useState<string | undefined>(
    undefined,
  );
  const [secretSignal, setSecretSignal] = useState(0);
  const [failed, setFailed] = useState(false);

  const chosen =
    liveBackground !== undefined ? liveBackground : settings.globalBackgroundUrl;
  const resolved = useResolvedAsset(chosen);
  const shown = failed ? siteConfig.defaultBackground : resolved;

  useEffect(() => {
    if (resolved.startsWith("data:")) {
      setFailed(false);
      return;
    }
    const image = new Image();
    image.onload = () => setFailed(false);
    image.onerror = () => {
      if (resolved !== siteConfig.defaultBackground) setFailed(true);
    };
    image.src = resolved;
  }, [resolved]);

  return (
    <div className="relative min-h-screen text-[#241f1b]">
      <PageBackdrop image={shown} />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:px-6">
        <SiteNav />
        <div
          className={`grid grid-cols-1 items-stretch gap-4 transition-all duration-300 md:grid-cols-2 lg:grid-cols-4 lg:[grid-template-rows:300px_minmax(300px,auto)_auto] ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          <ProfileCard onSecret={() => setSecretSignal((value) => value + 1)} />
          <DiaryCard />
          <CalendarCard />
          <VinylCard />
          <PlaygroundCard />
          <LoreCard />
          <OracleCard />
          <CapsuleCard />
          <RadarCard />
          <NotesCard />
        </div>
        <ActivityGraph />
      </div>
      <AdminControls
        secretSignal={secretSignal}
        onLiveBackground={setLiveBackground}
      />
    </div>
  );
}
