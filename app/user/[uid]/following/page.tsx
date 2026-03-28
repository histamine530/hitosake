"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function FollowingListPage() {
  const params = useParams();
  const uid = Array.isArray(params.uid) ? params.uid[0] : params.uid;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    // 自分がフォローしているユーザーID一覧を取得
    const q = query(collection(db, "follows"), where("followerId", "==", uid));

    const unsub = onSnapshot(q, async (snap) => {
      const followeeIds = snap.docs.map((d) => d.data().followeeId);

      const list: any[] = [];

      // フォローしているユーザーのプロフィールを取得
      for (const id of followeeIds) {
        const u = await getDoc(doc(db, "users", id));
        if (u.exists()) {
          list.push({ uid: id, ...u.data() });
        }
      }

      setUsers(list);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  if (loading) {
    return (
      <div className="p-5">
        <h2 className="text-xl font-bold text-[#1A2A4F] opacity-90">
          フォロー中のユーザー
        </h2>
        <p className="text-[#1A2A4F] opacity-80 mt-2">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold text-[#1A2A4F] opacity-90">
        フォロー中のユーザー
      </h2>

      {users.length === 0 && (
        <p className="mt-4 text-[#1A2A4F] opacity-80">
          まだフォローしているユーザーはいません。
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {users.map((u) => (
          <Link
            key={u.uid}
            href={`/user/${u.uid}`}
            className="flex items-center gap-3"
          >
            <img
              src={u.userPhoto || "/default.png"}
              className="w-12 h-12 rounded-full"
            />
            <div className="text-[#1A2A4F] font-semibold">{u.userName}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
