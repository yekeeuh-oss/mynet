"use client";

import { useEffect, useRef, useState } from "react";
import { isAdminPassword, siteConfig } from "@/lib/config";
import { deleteMedia, mediaKeys } from "@/lib/media-db";
import {
  getVisitorId,
  loadGalleryPhotos,
  loadGalleryPrefs,
  saveGalleryPhotos,
  saveGalleryPrefs,
} from "@/lib/gallery-store";
import { diaryRefreshEvent, notifyDiaryRefresh } from "@/lib/events";
import { readAdmin, saveAdmin } from "@/lib/storage";
import { useResolvedAsset } from "@/lib/use-resolved-asset";
import type { GalleryCategory, GalleryPhoto, GalleryPrefs } from "@/lib/types";
import { galleryCategories } from "@/lib/types";
import { BackgroundDialog } from "@/components/console/background-dialog";
import { PasswordDialog } from "@/components/console/password-dialog";
import { primaryButtonClass } from "@/components/console/modal";
import { PageBackdrop } from "@/components/console/page-backdrop";
import { SiteNav } from "@/components/console/site-nav";
import { GalleryCard } from "@/components/gallery/gallery-card";
import { GalleryUpload } from "@/components/gallery/gallery-upload";

type CategoryFilter = GalleryCategory | "全部";

export function GalleryScreen() {
  const [ready, setReady] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [prefs, setPrefs] = useState<GalleryPrefs>({
    saveAsDefault: false,
    color: "#f7f4ef",
    font: "sans",
    backgroundRef: "",
  });
  const [admin, setAdmin] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("全部");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [liveBackground, setLiveBackground] = useState<string | undefined>(undefined);
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function load() {
      setPhotos(loadGalleryPhotos());
      setPrefs(loadGalleryPrefs());
      setAdmin(readAdmin());
      setVisitorId(getVisitorId());
      setReady(true);
    }
    load();
    window.addEventListener(diaryRefreshEvent, load);
    return () => window.removeEventListener(diaryRefreshEvent, load);
  }, []);

  const chosen =
    liveBackground !== undefined ? liveBackground : prefs.backgroundRef;
  const resolved = useResolvedAsset(chosen || siteConfig.defaultBackground);

  function commitPhotos(next: GalleryPhoto[]) {
    setPhotos(next);
    saveGalleryPhotos(next);
    notifyDiaryRefresh();
  }

  function toggleLike(photoId: string) {
    const next = photos.map((photo) => {
      if (photo.id !== photoId) return photo;
      const existing = photo.likes.find((like) => like.visitorId === visitorId);
      const likes = existing
        ? photo.likes.filter((like) => like.id !== existing.id)
        : [
            ...photo.likes,
            {
              id: crypto.randomUUID(),
              visitorId,
              createdAt: new Date().toISOString(),
            },
          ];
      return { ...photo, likes };
    });
    commitPhotos(next);
  }

  function addComment(photoId: string, nickname: string, content: string) {
    const next = photos.map((photo) => {
      if (photo.id !== photoId) return photo;
      return {
        ...photo,
        comments: [
          ...photo.comments,
          {
            id: crypto.randomUUID(),
            nickname,
            content,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
    commitPhotos(next);
  }

  function deleteComment(photoId: string, commentId: string) {
    if (!admin) return;
    const next = photos.map((photo) => {
      if (photo.id !== photoId) return photo;
      return {
        ...photo,
        comments: photo.comments.filter((comment) => comment.id !== commentId),
      };
    });
    commitPhotos(next);
  }

  function deletePhoto(photoId: string) {
    if (!admin) return;
    const target = photos.find((photo) => photo.id === photoId);
    if (target) void deleteMedia(target.mediaId);
    commitPhotos(photos.filter((photo) => photo.id !== photoId));
  }

  function openGate() {
    if (admin) {
      setBackgroundOpen(true);
      return;
    }
    setPasswordOpen(true);
  }

  const visible =
    filter === "全部" ? photos : photos.filter((photo) => photo.category === filter);
  const groups = groupByMonth(visible);

  return (
    <div className="relative min-h-screen text-[#241f1b]">
      <PageBackdrop image={resolved || siteConfig.defaultBackground} />
      <div
        className={`relative mx-auto w-full max-w-6xl px-4 pb-24 pt-16 transition-all duration-300 sm:px-6 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <SiteNav />
        <header className="card-face mb-5 rounded-3xl border border-white/20 bg-white/60 p-5 shadow-lg">
          <p className="text-[11px] font-medium tracking-[0.22em] text-[#1E6B48]">
            GALLERY
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-serif text-4xl leading-none">光影画廊</h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className={primaryButtonClass}
              >
                拍照
              </button>
              <button
                type="button"
                onClick={() => albumRef.current?.click()}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#1E6B48]/25 px-5 text-sm font-medium text-[#1E6B48] transition-all duration-300 hover:bg-[#1E6B48]/8"
              >
                相册
              </button>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#5c564e]">
            手机上可以直接唤起相机或相册。感想的颜色和字体可以存成下次的默认排版。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["全部", ...galleryCategories] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1.5 text-sm transition-all duration-300 ${
                  filter === item
                    ? "bg-[#1E6B48] text-white"
                    : "border border-white/30 bg-white/50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </header>
        {groups.length === 0 ? (
          <p className="card-face rounded-3xl border border-white/20 bg-white/60 px-5 py-10 text-center text-sm leading-7 text-[#5c564e] shadow-lg">
            画廊还是空的。拍下一张，或从相册挑一张进来。
          </p>
        ) : (
          groups.map((group, index) => (
            <details key={group.key} open={index === 0} className="mb-6">
              <summary className="card-face mb-3 inline-flex cursor-pointer rounded-full border border-white/20 bg-white/60 px-4 py-2 text-sm text-[#241f1b] shadow-lg">
                {group.label} · {group.photos.length} 张
              </summary>
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {group.photos.map((photo) => (
                  <GalleryCard
                    key={photo.id}
                    photo={photo}
                    admin={admin}
                    visitorId={visitorId}
                    onToggleLike={toggleLike}
                    onComment={addComment}
                    onDeleteComment={deleteComment}
                    onDeletePhoto={deletePhoto}
                  />
                ))}
              </div>
            </details>
          ))
        )}
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) setUploadFile(file);
        }}
      />
      <input
        ref={albumRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) setUploadFile(file);
        }}
      />
      <button
        type="button"
        aria-label={admin ? "更换画廊背景" : "管理入口"}
        onClick={openGate}
        className={`fixed bottom-5 right-5 z-40 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/25 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:text-white ${
          admin ? "opacity-70 hover:opacity-100" : "opacity-30 hover:opacity-90"
        }`}
      >
        <GearIcon />
      </button>
      {passwordOpen ? (
        <PasswordDialog
          onClose={() => setPasswordOpen(false)}
          onUnlock={(password) => {
            if (!isAdminPassword(password)) return false;
            setAdmin(true);
            saveAdmin(true);
            setPasswordOpen(false);
            setBackgroundOpen(true);
            return true;
          }}
        />
      ) : null}
      {backgroundOpen ? (
        <BackgroundDialog
          title="画廊背景"
          description="这里的壁纸只属于光影画廊，不会改到日记页。拖入、粘贴或清除都会单独保存。"
          mediaId={mediaKeys.galleryBackground}
          initialRef={prefs.backgroundRef}
          onClose={() => {
            setBackgroundOpen(false);
            setLiveBackground(undefined);
          }}
          onPreview={setLiveBackground}
          onApply={(reference) => {
            if (!admin) return;
            const next = { ...prefs, backgroundRef: reference };
            setPrefs(next);
            saveGalleryPrefs(next);
          }}
        />
      ) : null}
      {uploadFile ? (
        <GalleryUpload
          file={uploadFile}
          prefs={prefs}
          onClose={() => setUploadFile(null)}
          onPublish={(photo, nextPrefs) => {
            commitPhotos([photo, ...photos]);
            setPrefs(nextPrefs);
            saveGalleryPrefs(nextPrefs);
            setUploadFile(null);
          }}
        />
      ) : null}
    </div>
  );
}

function groupByMonth(photos: GalleryPhoto[]) {
  const sorted = [...photos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const groups: { key: string; label: string; photos: GalleryPhoto[] }[] = [];
  for (const photo of sorted) {
    const date = new Date(photo.createdAt);
    const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    const existing = groups.find((group) => group.key === key);
    if (existing) existing.photos.push(photo);
    else groups.push({ key, label, photos: [photo] });
  }
  return groups;
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" fill="currentColor">
      <path d="M6.2 1.2h2.6l.3 1.5a4.7 4.7 0 0 1 1.3.7l1.4-.6 1.3 2.2-1.1 1a4.8 4.8 0 0 1 0 1.5l1.1 1-1.3 2.2-1.4-.6a4.7 4.7 0 0 1-1.3.7l-.3 1.5H6.2l-.3-1.5a4.7 4.7 0 0 1-1.3-.7l-1.4.6-1.3-2.2 1.1-1a4.8 4.8 0 0 1 0-1.5l-1.1-1 1.3-2.2 1.4.6a4.7 4.7 0 0 1 1.3-.7l.3-1.5Zm1.3 3.4a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Z" />
    </svg>
  );
}
