"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import HitoSakeCard from "@/components/HitoSakeCard";

import {
  followUser,
  unfollowUser,
  isFollowing,
} from "@/services/followService";

export default function UserProfilePage() {
  const params = useParams();
  const rawUid = params?.uid;
  const uid = Array.isArray(rawUid) ? rawUid[0] : (rawUid ?? "");

  const router = useRouter();

  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ★ フォロー状態
  const [following, setFollowing] = useState(false);

  // 🔐 ログイン状態の監視
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setAuthUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 👤 プロフィール情報取得
  useEffect(() => {
    if (!uid) return;

    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setProfile(snap.data());
      }
    };

    fetchProfile();
  }, [uid]);

  // 📝 投稿一覧取得
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "posts"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setPosts(list);
    });

    return () => unsub();
  }, [uid]);

  // ★ フォロー状態チェック
  useEffect(() => {
    const check = async () => {
      if (!authUser || !uid) return;
      if (authUser.uid === uid) return; // 自分自身はフォローしない

      const result = await isFollowing(authUser.uid, uid);
      setFollowing(result);
    };
    check();
  }, [authUser, uid]);

  // ★ フォロー/解除
  const handleFollow = async () => {
    if (!authUser) return router.push("/login?redirect=/user/" + uid);

    if (following) {
      await unfollowUser(authUser.uid, uid);
      setFollowing(false);
    } else {
      await followUser(authUser.uid, uid);
      setFollowing(true);
    }
  };

  // -------------------------

  if (loading || !profile) {
    return (
      <div className="p-5">
        <h2 className="text-xl font-bold text-[#1A2A4F] opacity-90">
          プロフィール
        </h2>
        <p className="text-[#1A2A4F] opacity-80">読み込み中...</p>
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
          src={profile.userPhoto || "/default.png"}
          className="w-16 h-16 rounded-full"
        />
        <div>
          <div className="text-lg font-bold text-[#1A2A4F]">
            {profile.userName}
          </div>
          <div className="text-sm text-gray-700">{profile.email}</div>
        </div>
      </div>

      {/* ★ フォローボタン（自分以外のときだけ） */}
      {authUser?.uid !== uid && (
        <button
          onClick={handleFollow}
          className={`mt-4 px-4 py-2 rounded-lg ${
            following ? "bg-gray-300 text-[#1A2A4F]" : "bg-[#1A2A4F] text-white"
          }`}
        >
          {following ? "フォロー中" : "フォローする"}
        </button>
      )}

      <h3 className="mt-8 mb-3 text-lg font-semibold text-[#1A2A4F] opacity-90">
        投稿一覧
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
