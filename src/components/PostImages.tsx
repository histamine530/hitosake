"use client";

import { useEffect, useRef, useState } from "react";

export default function PostImages({ images }: { images: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const pinchStart = useRef(0);
  const pinchZoomStart = useRef(1);
  const lastTap = useRef(0);

  const startX = useRef(0);
  const startY = useRef(0);
  const dxTotal = useRef(0);
  const dyTotal = useRef(0);

  const direction = useRef<"horizontal" | "vertical" | null>(null);

  const SWIPE_THRESHOLD = 50; // ← ナカジが選んだ「B：50px」

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setIndex(i);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (fullscreenIndex !== null) {
      setIsOpening(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpening(true);
        });
      });
    }
  }, [fullscreenIndex]);

  const closeFullscreen = () => {
    if (isClosing) return;
    setIsClosing(true);

    setTimeout(() => {
      setFullscreenIndex(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setIsClosing(false);
      direction.current = null;
    }, 350);
  };

  const prevImage = () => {
    if (fullscreenIndex === null) return;
    setFullscreenIndex((i) => Math.max(0, i! - 1));
  };

  const nextImage = () => {
    if (fullscreenIndex === null) return;
    setFullscreenIndex((i) => Math.min(images.length - 1, i! + 1));
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      {fullscreenIndex !== null && (
        <>
          {/* iPhone の戻る/進むジェスチャー用 20px */}
          <div className="fixed inset-y-0 left-0 w-5 pointer-events-none z-[60]" />
          <div className="fixed inset-y-0 right-0 w-5 pointer-events-none z-[60]" />

          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              pointerEvents: isClosing ? "none" : "auto",
              background: `rgba(20,15,10,${isClosing ? 0 : 0.85})`,
              transition: "background 350ms ease-out",
            }}
          >
            
            {/* 左上 × */}
            <button
              className="absolute top-4 left-4 z-[999] text-white/70 hover:text-white"
              style={{ fontSize: 24, lineHeight: "24px" }}
              onClick={closeFullscreen}
            >
              ×
            </button>

            {/* 左右矢印 */}
            {fullscreenIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-[999] text-white/70 hover:text-white"
                style={{ fontSize: 32 }}
                onClick={prevImage}
              >
                ‹
              </button>
            )}

            {fullscreenIndex < images.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-[999] text-white/70 hover:text-white"
                style={{ fontSize: 32 }}
                onClick={nextImage}
              >
                ›
              </button>
            )}

            {/* 画像レイヤー */}
            <div
              className="relative z-[900] touch-none"
              onTouchStart={(e) => {
                startX.current = e.touches[0].clientX;
                startY.current = e.touches[0].clientY;
                dxTotal.current = 0;
                dyTotal.current = 0;
                direction.current = null;

                if (e.touches.length === 2) {
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  pinchStart.current = Math.sqrt(dx * dx + dy * dy);
                  pinchZoomStart.current = zoom;
                }
              }}
              onTouchMove={(e) => {
                const x = e.touches[0].clientX;
                const y = e.touches[0].clientY;

                const dx = x - startX.current;
                const dy = y - startY.current;

                dxTotal.current = dx;
                dyTotal.current = dy;

                // ピンチズーム
                if (e.touches.length === 2) {
                  e.preventDefault();
                  const dx2 = e.touches[0].clientX - e.touches[1].clientX;
                  const dy2 = e.touches[0].clientY - e.touches[1].clientY;
                  const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                  const scale =
                    (dist / pinchStart.current) * pinchZoomStart.current;
                  const clamped = Math.min(Math.max(scale, 1), 2.5);
                  setZoom(clamped);
                  return;
                }

                // ズーム中は方向ロック無効
                if (zoom > 1) return;

                // 方向ロック（高速 8px）
                if (!direction.current) {
                  if (Math.abs(dx) > 8) direction.current = "horizontal";
                  else if (Math.abs(dy) > 8) direction.current = "vertical";
                }

                // 横スワイプ中 → 何もしない（touchend で処理）
                if (direction.current === "horizontal") return;

                // 下スワイプ閉じ
                if (direction.current === "vertical") {
                  if (dy > 0) {
                    e.preventDefault();
                    setOffset({ x: 0, y: dy });
                  }
                }
              }}
              onTouchEnd={() => {
                if (zoom > 1) return;

                // 横スワイプ判定（touchend）
                if (direction.current === "horizontal") {
                  if (dxTotal.current > SWIPE_THRESHOLD) prevImage();
                  else if (dxTotal.current < -SWIPE_THRESHOLD) nextImage();
                }

                // 下スワイプ閉じ
                if (direction.current === "vertical") {
                  if (dyTotal.current > 80) closeFullscreen();
                  else setOffset({ x: 0, y: 0 });
                }

                direction.current = null;
                dxTotal.current = 0;
                dyTotal.current = 0;
              }}
              onClick={() => {
                const now = Date.now();
                if (now - lastTap.current < 300) {
                  setZoom((z) => (z === 1 ? 2 : 1));
                  setOffset({ x: 0, y: 0 });
                }
                lastTap.current = now;
              }}
            >
              <img
                src={images[fullscreenIndex]}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: isClosing
                    ? `scale(0.85) translateY(200px)`
                    : isOpening
                      ? `scale(${zoom}) translate(${offset.x / zoom}px, ${
                          offset.y / zoom
                        }px)`
                      : "scale(0.9)",
                  transition: isClosing
                    ? "transform 350ms ease-out"
                    : "transform 200ms ease-out",
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* 通常表示 */}
      <div className="relative mb-5">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory"
        >
          {images.map((url, i) => (
            <div
              key={i}
              className="w-full h-72 flex-shrink-0 snap-start flex items-center justify-center bg-black/5 rounded-xl"
              onClick={() => setFullscreenIndex(i)}
            >
              <img src={url} className="max-h-full max-w-full object-contain" />
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
