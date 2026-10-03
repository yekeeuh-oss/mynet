"use client";

import { useEffect, useState } from "react";
import { formatEntryTime } from "@/lib/dates";
import { getMedia } from "@/lib/media-db";
import type { GalleryPhoto } from "@/lib/types";
import { fieldClass, primaryButtonClass } from "@/components/console/modal";

const fontFamily = {
  sans: "var(--font-sans), sans-serif",
  serif: "var(--font-serif), serif",
  script: '"Ma Shan Zheng", "Segoe Script", cursive',
} as const;

type GalleryCardProps = {
  photo: GalleryPhoto;
  admin: boolean;
  visitorId: string;
  onToggleLike: (photoId: string) => void;
  onComment: (photoId: string, nickname: string, content: string) => void;
  onDeleteComment: (photoId: string, commentId: string) => void;
  onDeletePhoto: (photoId: string) => void;
};

export function GalleryCard({
  photo,
  admin,
  visitorId,
  onToggleLike,
  onComment,
  onDeleteComment,
  onDeletePhoto,
}: GalleryCardProps) {
  const [source, setSource] = useState("");
  const [burst, setBurst] = useState(false);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const liked = photo.likes.some((like) => like.visitorId === visitorId);

  useEffect(() => {
    let cancelled = false;
    void getMedia(photo.mediaId).then((value) => {
      if (!cancelled) setSource(value ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [photo.mediaId]);

  return (
    <article className="card-face mb-4 break-inside-avoid overflow-hidden rounded-3xl border border-white/20 bg-white/60 shadow-lg transition-all duration-300 hover:shadow-2xl">
      <div className="relative">
        {source ? (
          <img src={source} alt={photo.caption || "画廊照片"} className="w-full" />
        ) : (
          <div className="h-48 bg-[#1c3d34]/30" />
        )}
        {photo.caption ? (
          <p
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-12 text-lg leading-8"
            style={{
              color: photo.color,
              fontFamily: fontFamily[photo.font],
              textShadow: "0 1px 8px rgba(0,0,0,0.45)",
            }}
          >
            {photo.caption}
          </p>
        ) : null}
      </div>
      <div className="p-4 text-[#241f1b]">
        <div className="flex items-center justify-between gap-3 text-xs text-[#5c564e]">
          <span className="rounded-full bg-[#1E6B48]/10 px-2 py-1 text-[#1E6B48]">
            {photo.category}
          </span>
          <span>{formatEntryTime(photo.createdAt)}</span>
        </div>
        <button
          type="button"
          aria-pressed={liked}
          onClick={() => {
            setBurst(true);
            window.setTimeout(() => setBurst(false), 280);
            onToggleLike(photo.id);
          }}
          className={`mt-3 inline-flex items-center gap-2 text-sm transition-all duration-300 ${
            burst ? "scale-125" : "scale-100"
          }`}
        >
          <Heart filled={liked} />
          <span>{photo.likes.length}</span>
        </button>
        <ul className="mt-3 space-y-2">
          {photo.comments.map((comment) => (
            <li key={comment.id} className="text-sm leading-6">
              <span className="font-medium">{comment.nickname}</span>
              <span className="text-[#5c564e]"> · {comment.content}</span>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!nickname.trim() || !content.trim()) return;
            onComment(photo.id, nickname.trim(), content.trim());
            setContent("");
          }}
        >
          <input
            value={nickname}
            maxLength={20}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="昵称"
            className={`${fieldClass} h-10`}
          />
          <input
            value={content}
            maxLength={300}
            onChange={(event) => setContent(event.target.value)}
            placeholder="留一句"
            className={`${fieldClass} h-10`}
          />
          <button
            type="submit"
            disabled={!nickname.trim() || !content.trim()}
            className={`${primaryButtonClass} h-10 self-start px-4`}
          >
            留言
          </button>
        </form>
        {admin ? (
          <details open className="mt-4 rounded-2xl border border-white/20 bg-white/45 p-3">
            <summary className="cursor-pointer text-sm font-medium text-[#1E6B48]">
              互动管理
            </summary>
            <p className="mt-3 text-xs tracking-wide text-[#5c564e]">点赞记录</p>
            {photo.likes.length === 0 ? (
              <p className="mt-1 text-sm text-[#5c564e]">还没有点赞。</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm leading-6">
                {photo.likes.map((like) => (
                  <li key={like.id}>
                    {formatEntryTime(like.createdAt)} · 访客 {like.visitorId.slice(0, 8)}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs tracking-wide text-[#5c564e]">评论管理</p>
            {photo.comments.length === 0 ? (
              <p className="mt-1 text-sm text-[#5c564e]">还没有评论。</p>
            ) : (
              <ul className="mt-1 space-y-2">
                {photo.comments.map((comment) => (
                  <li key={comment.id} className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      {comment.nickname}：{comment.content}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteComment(photo.id, comment.id)}
                      className="shrink-0 text-xs text-red-600 transition-all duration-300 hover:text-red-700"
                    >
                      删除
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => onDeletePhoto(photo.id)}
              className="mt-3 text-xs text-red-600 transition-all duration-300 hover:text-red-700"
            >
              删除这张相片
            </button>
          </details>
        ) : null}
      </div>
    </article>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 15.2 7.8 14.1C4.2 10.8 2 8.8 2 6.4 2 4.5 3.5 3 5.4 3c1.1 0 2.1.5 2.8 1.3C8.8 3.5 9.8 3 10.9 3 12.8 3 14.3 4.5 14.3 6.4c0 2.4-2.2 4.4-5.8 7.7L9 15.2Z"
        fill={filled ? "#1E6B48" : "none"}
        stroke="#1E6B48"
        strokeWidth="1.2"
      />
    </svg>
  );
}
