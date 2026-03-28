"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";
import HitoSakeCard from "@/components/HitoSakeCard";

export default function HomePage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<"all" | "follow">("all");

  // フォロー中のユーザーID一覧
  const [followees, setFollowees] = useState<string[]>([]);

  // 🔐 ログイン状態
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setAuthUser(u));
    return () => unsub();
  }, []);

  // 🟧 フォロー中ユーザー一覧取得
  useEffect(() => {
    if (!authUser) return;

    const fetchFollowees = async () => {
      const q = query(
        collection(db, "follows"),
        where("followerId", "==", authUser.uid),
      );
      const snap = await getDocs(q);
      const ids = snap.docs.map((d) => d.data().followeeId);
      setFollowees(ids);
    };

    fetchFollowees();
  }, [authUser]);

  // 🟦 投稿取得（タブに応じて切り替え）
  useEffect(() => {
    if (!authUser) return;

    let q;

    if (tab === "all") {
      // 全体タイムライン
      q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    } else {
      // フォロー中タイムライン
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
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setPosts(list);
    });

    return () => unsub();
  }, [tab, followees, authUser]);

  return (
    <div className="p-5">
      {/* 🟦 タブ（sticky） */}
      <div className="sticky top-0 bg-white pb-3 z-10">
        <div className="flex gap-6 border-b border-gray-200">
          <button
            onClick={() => setTab("all")}
            className={`pb-2 text-lg ${
              tab === "all"
                ? "text-[#1A2A4F] font-bold border-b-2 border-[#1A2A4F]"
                : "text-gray-500"
            }`}
          >
            みんな
          </button>

          <button
            onClick={() => setTab("follow")}
            className={`pb-2 text-lg ${
              tab === "follow"
                ? "text-[#1A2A4F] font-bold border-b-2 border-[#1A2A4F]"
                : "text-gray-500"
            }`}
          >
            フォロー中
          </button>
        </div>
      </div>

      {/* 投稿一覧 */}
      <div className="flex flex-col gap-6 mt-4">
        {posts.length === 0 && (
          <p className="text-[#1A2A4F] opacity-80">
            {tab === "follow"
              ? "フォローしている人の投稿がありません。"
              : "投稿がありません。"}
          </p>
        )}

        {posts.map((p) => (
          <Link key={p.id} href={`/post/${p.id}`}>
            <HitoSakeCard {...p} />
          </Link>
        ))}
      </div>
    </div>
  );
}
