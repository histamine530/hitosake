"use client";
export const dynamic = "force-dynamic";

import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingAnon, setLoadingAnon] = useState(false);

  // Google ログイン
  const handleGoogleLogin = async () => {
    if (!auth) return;

    try {
      setLoadingGoogle(true);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        router.push("/setup");
      } else {
        router.push(redirect);
      }
    } catch (error) {
      console.error("Google ログイン失敗:", error);
      setLoadingGoogle(false);
    }
  };

  // 匿名ログイン
  const handleAnonymousLogin = async () => {
    try {
      setLoadingAnon(true);

      const result = await signInAnonymously(auth);
      const user = result.user;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        router.push("/setup");
      } else {
        router.push(redirect);
      }
    } catch (error) {
      console.error("匿名ログイン失敗:", error);
      setLoadingAnon(false);
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

      {/* Google ログイン */}
      <button
        onClick={handleGoogleLogin}
        disabled={loadingGoogle || loadingAnon}
        className="w-4/5 bg-white text-[#1A2A4F] py-3 rounded-xl text-lg border shadow-sm mb-4"
      >
        {loadingGoogle ? "読み込み中..." : "Google でログイン"}
      </button>

      {/* 匿名ログイン */}
      <button
        onClick={handleAnonymousLogin}
        disabled={loadingGoogle || loadingAnon}
        className="w-4/5 bg-[#1A2A4F] text-white py-3 rounded-xl text-lg"
      >
        {loadingAnon ? "読み込み中..." : "匿名ではじめる"}
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
