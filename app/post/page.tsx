"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function PostPage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false); // ← 投稿中フラグ

  // 🔐 Auth 状態取得
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!user || posting) return;

    setPosting(true); // ← 投稿中に切り替え

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const profile = snap.data();

    let imageUrls: string[] = [];

    for (const file of files) {
      const fileRef = ref(storage, `images/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      imageUrls.push(url);
    }

    await addDoc(collection(db, "posts"), {
      text,
      images: imageUrls,
      location,
      userName: profile?.userName ?? "",
      userPhoto: profile?.userPhoto ?? "",
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    // 🎉 投稿完了 → 入力欄クリア
    setText("");
    setFiles([]);
    setPosting(false);
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  };

  // 🔄 読み込み中
  if (loading) {
    return (
      <div className="p-5">
        <h2 className="text-xl font-bold text-[#1A2A4F]">今日の一杯を投稿</h2>
        <p className="text-[#1A2A4F] opacity-80">読み込み中…</p>
      </div>
    );
  }

  // 🔐 未ログイン時の UI
  if (!user) {
    return (
      <div className="p-5 text-center">
        <h2 className="text-xl font-bold text-[#1A2A4F] mb-4">
          今日の一杯を投稿
        </h2>
        <p className="text-[#1A2A4F] opacity-80 mb-6">
          投稿するにはログインが必要です。
        </p>

        <Link href="/login">
          <button className="px-5 py-3 bg-[#1A2A4F] text-white rounded-xl shadow">
            ログインする
          </button>
        </Link>
      </div>
    );
  }

  // 🔓 ログイン済み → 投稿フォーム
  return (
    <div className="p-5 bg-[#FAF7F2] min-h-screen">
      <h2 className="text-xl font-bold mb-5 text-[#1A2A4F]">
        今日の一杯を投稿
      </h2>

      {/* 画像アップロード */}
      <div className="mb-4">
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="block w-full text-sm text-gray-700
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-semibold
                     file:bg-[#1A2A4F] file:text-white
                     hover:file:bg-[#16213d]"
        />
      </div>

      {/* メモ（iPhoneで薄くならないように修正済み） */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="今日の一杯のメモ"
        className="w-full p-3 rounded-lg border border-gray-300
                   bg-white text-[#1A2A4F]
                   placeholder:text-gray-400
                   focus:text-[#1A2A4F]
                   focus:placeholder:text-gray-300
                   focus:outline-none focus:ring-2 focus:ring-[#1A2A4F]
                   mb-4"
        rows={4}
      />

      {/* 位置情報 */}
      <button
        onClick={getLocation}
        className="w-full py-3 rounded-lg bg-[#1A2A4F] text-white font-semibold
                   hover:bg-[#16213d] transition mb-4"
      >
        位置情報を取得
      </button>

      {/* 投稿ボタン（ローディング対応） */}
      <button
        onClick={handlePost}
        disabled={posting}
        className="w-full py-3 rounded-lg bg-[#1A2A4F] text-white font-semibold
                   hover:bg-[#16213d] transition disabled:opacity-50"
      >
        {posting ? "投稿中…" : "投稿する"}
      </button>
    </div>
  );
}
