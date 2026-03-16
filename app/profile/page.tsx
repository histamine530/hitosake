"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HitoSakeCard from "@/components/HitoSakeCard";

export default function ProfilePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setAuthUser(u);

      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      }

      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authUser) return;

    const q = query(
      collection(db, "posts"),
      where("userId", "==", authUser.uid),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(list);
    });

    return () => unsub();
  }, [authUser]);

  if (loading) {
    return (
      <div className="p-5">
        <h2 className="text-xl font-bold text-[#1A2A4F] opacity-90">
          プロフィール
        </h2>
        <p className="text-[#1A2A4F] opacity-80">読み込み中...</p>
      </div>
    );
  }

  // 🔐 未ログイン時の UI（redirect 付き）
  if (!authUser) {
    return (
      <div className="p-5 text-center">
        <h2 className="text-xl font-bold text-[#1A2A4F] opacity-90 mb-4">
          プロフィール
        </h2>
        <p className="text-[#1A2A4F] opacity-80 mb-6">ログインしてください。</p>

        <Link href="/login?redirect=/profile">
          <button className="px-5 py-3 bg-[#1A2A4F] text-white rounded-xl shadow">
            ログインする
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold text-[#1A2A4F] opacity-90">
        プロフィール
      </h2>

      <div className="flex items-center gap-4 mt-4">
        <img
          src={profile?.userPhoto || "/default.png"}
          className="w-16 h-16 rounded-full"
        />
        <div>
          <div className="text-lg font-bold text-[#1A2A4F]">
            {profile?.userName}
          </div>
          <div className="text-sm text-gray-700">{authUser.email}</div>
        </div>
      </div>

      <button
        onClick={() => router.push("/profile/edit")}
        className="mt-4 px-4 py-2 bg-[#1A2A4F] text-white rounded-lg"
      >
        編集する
      </button>

      {/* 🔓 ログアウト導線 */}
      <button
        onClick={async () => {
          await auth.signOut();
          router.push("/"); // ← / に戻す
        }}
        className="mt-3 px-4 py-2 bg-gray-200 text-[#1A2A4F] rounded-lg"
      >
        ログアウト
      </button>

      <h3 className="mt-8 mb-3 text-lg font-semibold text-[#1A2A4F] opacity-90">
        あなたの投稿一覧
      </h3>

      {posts.length === 0 && (
        <p className="text-[#1A2A4F] opacity-80">まだ投稿がありません。</p>
      )}

      <div className="flex flex-col gap-6 mt-3">
        {posts.map((p) => (
          <div key={p.id} onClick={() => router.push(`/post/${p.id}`)}>
            <HitoSakeCard
              images={p.images || []}
              placeName={p.placeName}
              text={p.text}
              userPhoto={p.userPhoto}
              userName={p.userName}
              createdAt={p.createdAt}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
