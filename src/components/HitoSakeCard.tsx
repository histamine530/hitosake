"use client";

import { useState } from "react";

type HitoSakeCardProps = {
  images?: string[];
  placeName?: string;
  text?: string;
  userPhoto?: string;
  userName?: string;
  createdAt?: any; // Firestore Timestamp or string
};

export default function HitoSakeCard({
  images = [],
  placeName = "",
  text = "",
  userPhoto = "",
  userName = "",
  createdAt,
}: HitoSakeCardProps) {
  // createdAt が Timestamp の場合に安全に文字列へ変換
  const formattedDate = createdAt?.seconds
    ? new Date(createdAt.seconds * 1000).toLocaleString("ja-JP")
    : createdAt || "";

  const [index, setIndex] = useState(0);

  // スクロール位置から index を更新
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    setIndex(newIndex);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 投稿者 */}
      <div className="flex items-center gap-3">
        <img
          src={userPhoto || "/default.png"}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-[#1A2A4F]">{userName}</p>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>

      {/* 本文 */}
      <p className="text-[#1A2A4F] opacity-90 whitespace-pre-line leading-relaxed">
        {text}
      </p>

      {/* 画像（複数対応） */}
      {images.length > 0 && (
        <div className="relative w-full overflow-hidden rounded-xl">
          {/* 横スクロール */}
          <div
            className="flex overflow-x-scroll snap-x snap-mandatory scroll-smooth"
            onScroll={handleScroll}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                className="w-full h-auto object-cover snap-center flex-shrink-0 rounded-xl transition-all duration-300"
                style={{ minWidth: "100%" }}
              />
            ))}
          </div>

          {/* ページインジケーター */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === i ? "bg-white opacity-90" : "bg-white opacity-40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* フッター */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span className="opacity-80">{placeName}</span>
      </div>
    </div>
  );
}
