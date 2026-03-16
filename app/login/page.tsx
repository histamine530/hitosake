"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/"; // ← 元のページへ戻す
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      // 匿名ログイン
      const result = await signInAnonymously(auth);
      const user = result.user;

      // Firestore にユーザー情報があるか確認（初回判定）
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        // 初回 → ユーザー名設定へ
        router.push("/setup");
      } else {
        // 2回目以降 → 元のページへ戻す
        router.push(redirect);
      }
    } catch (error) {
      console.error("ログイン失敗:", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="text-2xl font-semibold text-[#1A2A4F] mb-4">
        HitoSake へようこそ
      </h1>

      <p className="text-center text-[#1A2A4F] mb-8">
        その時の気持ちを、そっと残す場所です。
      </p>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-4/5 bg-[#1A2A4F] text-white py-3 rounded-xl text-lg"
      >
        {loading ? "読み込み中..." : "はじめる"}
      </button>

      <p className="mt-6 text-sm text-[#1A2A4F] opacity-70">
        <a href="/terms" className="underline">
          利用規約
        </a>{" "}
        に同意して進む
      </p>
    </div>
  );
}
