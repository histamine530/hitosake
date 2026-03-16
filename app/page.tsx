"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import HitoSakeCard from "@/components/HitoSakeCard";

export default function HomePage() {
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [queryText, setQueryText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSearchIcon, setShowSearchIcon] = useState(true);

  const lastScrollY = useRef(0);
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [hitIds, setHitIds] = useState<string[]>([]);
  const [hitIndex, setHitIndex] = useState(0);

  // -------------------------------
  // Firestore リアルタイム取得
  // -------------------------------
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const newPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 新規投稿アニメーション
      const newIds = newPosts
        .filter((p) => !posts.some((old) => old.id === p.id))
        .map((p) => p.id);

      if (newIds.length > 0) {
        setAnimatingIds((prev) => [...prev, ...newIds]);
        setTimeout(() => {
          setAnimatingIds((prev) => prev.filter((id) => !newIds.includes(id)));
        }, 300);
      }

      setPosts(newPosts);
    });

    return () => unsub();
  }, []); // ← これが正しい

  // -------------------------------
  // スクロール方向で検索アイコンの表示/非表示
  // -------------------------------
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;

      if (current > lastScrollY.current) {
        setShowSearchIcon(false); // 下スクロール → 隠す
      } else {
        setShowSearchIcon(true); // 上スクロール → 出す
      }

      lastScrollY.current = current;
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!queryText) return;

    const t = queryText.toLowerCase();

    const firstHit = posts.find((p) => {
      const text = (p.text || "").toString().toLowerCase();
      const place = (p.placeName || "").toString().toLowerCase();
      const user = (p.userName || "").toString().toLowerCase();
      return text.includes(t) || place.includes(t) || user.includes(t);
    });

    if (firstHit && postRefs.current[firstHit.id]) {
      postRefs.current[firstHit.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [queryText, posts]);

  useEffect(() => {
    const t = queryText.toLowerCase();

    const hits = posts
      .filter((p) => {
        const text = (p.text || "").toString().toLowerCase();
        const place = (p.placeName || "").toString().toLowerCase();
        const user = (p.userName || "").toString().toLowerCase();
        return text.includes(t) || place.includes(t) || user.includes(t);
      })
      .map((p) => p.id);

    setHitIds(hits);
    setHitIndex(0); // 検索し直したら最初のヒットへ
  }, [queryText, posts]);

  useEffect(() => {
    if (hitIds.length === 0) return;

    const id = hitIds[hitIndex];
    const el = postRefs.current[id];

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [hitIndex, hitIds]);

  // -------------------------------
  // ローカル検索
  // -------------------------------
  const filtered = posts.filter((p) => {
    const t = queryText.toLowerCase();

    const text = (p.text || "").toString().toLowerCase();
    const place = (p.placeName || "").toString().toLowerCase();
    const user = (p.userName || "").toString().toLowerCase();

    return text.includes(t) || place.includes(t) || user.includes(t);
  });

  return (
    <div className="p-5 relative min-h-screen bg-[#FAF7F2]">
      {/* 🔍 検索アイコン */}
      <button
        onClick={() => setSearchOpen(!searchOpen)}
        className={`
          fixed top-4 right-4 z-40
          text-[#1A2A4F] opacity-70 hover:opacity-100
          transition-all duration-150
          ${showSearchIcon ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
        `}
      >
        🔍
      </button>

      {/* 🔍 下からキビキビ出る検索バー（右寄り） */}
      {searchOpen && (
        <div
          className="
            fixed top-16 right-4 z-30
            transition-all duration-150
          "
          style={{
            opacity: searchOpen ? 1 : 0,
            transform: searchOpen ? "translateY(0)" : "translateY(10px)",
          }}
        >
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchOpen(false); // ← Enter で検索バーを閉じる
              }
            }}
            placeholder="検索…"
            className="
    w-64 p-3
    rounded-lg shadow-md
    bg-white
    text-[#1A2A4F] placeholder-[#1A2A4F]/50
    outline-none
  "
          />
        </div>
      )}

      <h2 className="mb-5 text-xl font-bold text-[#1A2A4F] opacity-90">
        タイムライン
      </h2>

      {posts.length === 0 && (
        <p className="mt-3 text-[#1A2A4F] opacity-80">まだ投稿がありません。</p>
      )}

      {/* 0件メッセージ */}
      {filtered.length === 0 && queryText && (
        <p className="text-center text-[#1A2A4F] opacity-60 mt-10">
          まだ見つかりませんでした…
        </p>
      )}

      <div className="flex flex-col gap-4 mt-4">
        {posts.map((p) => {
          const t = queryText.toLowerCase();

          const isMatch =
            (p.text || "").toString().toLowerCase().includes(t) ||
            (p.placeName || "").toString().toLowerCase().includes(t) ||
            (p.userName || "").toString().toLowerCase().includes(t);

          return (
            <div
              key={p.id}
              ref={(el) => {
                postRefs.current[p.id] = el;
              }}
              className={`
          bg-white rounded-2xl shadow-sm p-5
          transition-all duration-300
          ${
            animatingIds.includes(p.id)
              ? "opacity-0 translate-y-3"
              : "opacity-100 translate-y-0"
          }
          ${
            queryText ? (isMatch ? "opacity-100" : "opacity-40") : "opacity-100"
          }
        `}
            >
              <Link
                href={`/post/${p.id}`}
                className="no-underline text-inherit"
              >
                <HitoSakeCard
                  images={p.images || []}
                  placeName={p.placeName}
                  text={p.text}
                  userPhoto={p.userPhoto}
                  userName={p.userName}
                  createdAt={p.createdAt}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
