"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Firestore に userName が既にあるなら / に飛ばす
  useEffect(() => {
    const checkUser = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      // Firestore にデータがあり、userName が設定済みならホームへ
      if (snap.exists() && snap.data()?.userName) {
        router.push("/");
      }
    };

    checkUser();
  }, [router]);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !name.trim()) return;

    try {
      setLoading(true);

      // Firestore にユーザー情報を保存（匿名でもGoogleでも同じ）
      await setDoc(
        doc(db, "users", user.uid),
        {
          userName: name.trim(),
          userPhoto: "",
          createdAt: new Date(),
        },
        { merge: true }, // ← 既存データがあっても上書きしない
      );

      router.push("/");
    } catch (error) {
      console.error("保存失敗:", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="text-2xl font-semibold text-[#1A2A4F] mb-6">
        あなたの名前を教えてください
      </h1>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前を入力"
        className="w-4/5 border border-gray-300 rounded-xl px-4 py-3 mb-6 text-[#1A2A4F]"
      />

      <button
        onClick={handleSave}
        disabled={loading || !name.trim()}
        className="w-4/5 bg-[#1A2A4F] text-white py-3 rounded-xl text-lg disabled:opacity-50"
      >
        {loading ? "保存中..." : "はじめる"}
      </button>
    </div>
  );
}
