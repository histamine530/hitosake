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

// ★ フォロー機能
import {
  followUser,
  unfollowUser,
  isFollowing,
} from "@/services/followService";

export default function ProfilePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ★ フォロー状態
  const [following, setFollowing] = useState(false);

  const router = useRouter();

  // 🔐 ログイン状態の監視
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setAuthUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 👤 プロフィール情報
  useEffect(() => {
    if (!authUser) return;

    const unsub = onSnapshot(doc(db, "users", authUser.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
    });

    return () => unsub();
  }, [authUser]);

  // 📝 自分の投稿一覧
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

  // ★ フォロー状態チェック（※自分のページでは使わないが、他人ページ用に残す）
  useEffect(() => {
    const check = async () => {
      if (!authUser || !profile) return;
      if (authUser.uid === profile.uid) return; // 自分自身はフォローしない

      const result = await isFollowing(authUser.uid, profile.uid);
      setFollowing(result);
    };
    check();
  }, [authUser, profile]);

  // ★ フォロー/解除ボタン
  const handleFollow = async () => {
    if (!authUser || !profile) return;

    if (following) {
      await unfollowUser(authUser.uid, profile.uid);
      setFollowing(false);
    } else {
      await followUser(authUser.uid, profile.uid);
      setFollowing(true);
    }
  };

  // -------------------------

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

      {/* ★ 自分のプロフィールなのでフォローボタンは表示しない */}
      {/* 他人のプロフィールページを作るときはここに表示する */}
      <Link
        href={`/user/${authUser?.uid}/following`}
        className="mt-3 inline-block text-[#1A2A4F] underline opacity-80"
      >
        フォロー中のユーザー
      </Link>

      <button
        onClick={() => router.push("/profile/edit")}
        className="mt-4 px-4 py-2 bg-[#1A2A4F] text-white rounded-lg"
      >
        編集する
      </button>

      <button
        onClick={async () => {
          await auth.signOut();
          router.push("/");
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
          <Link key={p.id} href={`/post/${p.id}`}>
            <HitoSakeCard {...p} />
          </Link>
        ))}
      </div>
    </div>
  );
}
