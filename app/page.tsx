"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import HitoSakeCard from "@/components/HitoSakeCard";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function HomePage() {
  const [user, setUser] = useState<any | null>(null);

  const [animatingIds, setAnimatingIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [queryText, setQueryText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSearchIcon, setShowSearchIcon] = useState(true);

  const [tab, setTab] = useState<"all" | "following">("all");
  const [followees, setFollowees] = useState<string[]>([]);

  const lastScrollY = useRef(0);

  // -------------------------------
  // Auth 状態取得
  // -------------------------------
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // -------------------------------
  // フォロー中ユーザー一覧取得
  // -------------------------------
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "follows"),
      where("followerId", "==", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const ids = snap.docs.map((d) => d.data().followeeId);
      setFollowees(ids);
    });

    return () => unsub();
  }, [user]);

  // -------------------------------
  // 投稿取得（タブで分岐）
  // -------------------------------
  useEffect(() => {
    let q;

    if (tab === "all") {
      q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    } else {
      if (followees.length === 0) {
        setPosts([]);
        return;
      }

      q = query(
        collection(db, "posts"),
        where("userId", "in", followees),
        orderBy("createdAt", "desc"),
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      const newPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

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
  }, [tab, followees]);

  // -------------------------------
  // スクロール方向で検索アイコンの表示/非表示
  // -------------------------------
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setShowSearchIcon(current <= lastScrollY.current);
      lastScrollY.current = current;
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // -------------------------------
  // 検索フィルタ
  // -------------------------------
  const filtered = posts.filter((p) => {
    const t = queryText.toLowerCase();
    return (
      (p.text || "").toLowerCase().includes(t) ||
      (p.placeName || "").toLowerCase().includes(t) ||
      (p.userName || "").toLowerCase().includes(t)
    );
  });

  return (
    <div className="p-5 relative min-h-screen bg-[#FAF7F2]">
      {/* 🔐 ログイン / プロフィール */}
      <div className="fixed top-4 right-20 z-40">
        {user ? (
          <Link href="/profile">
            <button className="px-4 py-2 bg-white shadow rounded-lg text-[#1A2A4F]">
              プロフィール
            </button>
          </Link>
        ) : (
          <Link href="/login">
            <button className="px-4 py-2 bg-white shadow rounded-lg text-[#1A2A4F]">
              ログイン
            </button>
          </Link>
        )}
      </div>

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

      {/* 🔍 検索バー */}
      {searchOpen && (
        <div className="fixed top-16 right-4 z-30 transition-all duration-150">
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="検索…"
            className="w-64 p-3 rounded-lg shadow-md bg-white text-[#1A2A4F] placeholder-[#1A2A4F]/50 outline-none"
          />
        </div>
      )}

      <h2 className="mb-5 text-xl font-bold text-[#1A2A4F] opacity-90">
        タイムライン
      </h2>

      {/* 🟦 タブ */}
      <div className="flex gap-6 mb-4">
        <button
          onClick={() => setTab("all")}
          className={`pb-1 ${
            tab === "all"
              ? "font-bold text-[#1A2A4F] border-b-2 border-[#1A2A4F]"
              : "opacity-60"
          }`}
        >
          みんな
        </button>

        <button
          onClick={() => setTab("following")}
          className={`pb-1 ${
            tab === "following"
              ? "font-bold text-[#1A2A4F] border-b-2 border-[#1A2A4F]"
              : "opacity-60"
          }`}
        >
          フォロー中
        </button>
      </div>

      {/* 投稿がないとき */}
      {posts.length === 0 && (
        <p className="mt-3 text-[#1A2A4F] opacity-80">
          {tab === "all"
            ? "まだ投稿がありません。"
            : "フォロー中のユーザーの投稿がありません。"}
        </p>
      )}

      {/* 検索結果なし */}
      {filtered.length === 0 && queryText && (
        <p className="text-center text-[#1A2A4F] opacity-60 mt-10">
          まだ見つかりませんでした…
        </p>
      )}

      {/* 投稿一覧 */}
      <div className="flex flex-col gap-4 mt-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`
              bg-white rounded-2xl shadow-sm p-5
              transition-all duration-300
              ${
                animatingIds.includes(p.id)
                  ? "opacity-0 translate-y-3"
                  : "opacity-100 translate-y-0"
              }
            `}
          >
            <Link href={`/post/${p.id}`} className="no-underline text-inherit">
              <HitoSakeCard {...p} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
