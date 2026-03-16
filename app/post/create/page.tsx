"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CreatePostPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 画像選択
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    setImages(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  // 投稿処理
  const handlePost = async () => {
    const user = auth.currentUser;
    if (!user || !text.trim()) return;

    try {
      setLoading(true);

      // 画像アップロード
      const imageUrls: string[] = [];

      for (const file of images) {
        const fileRef = ref(
          storage,
          `posts/${user.uid}/${Date.now()}_${file.name}`,
        );
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        imageUrls.push(url);
      }

      // Firestore に保存
      await addDoc(collection(db, "posts"), {
        text: text.trim(),
        images: imageUrls,
        createdAt: serverTimestamp(),
        uid: user.uid,
      });

      router.push("/");
    } catch (error) {
      console.error("投稿失敗:", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen px-6 py-8">
      <h1 className="text-2xl font-semibold text-[#1A2A4F] mb-6">
        今日の一杯を残す
      </h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="どんな気持ちの一杯？"
        className="w-full max-w-md h-32 border border-gray-300 rounded-xl p-4 text-[#1A2A4F] mb-6"
      />

      {/* 画像選択 */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="mb-4"
      />

      {/* プレビュー */}
      {previewUrls.length > 0 && (
        <div className="w-full max-w-md overflow-x-auto flex gap-3 mb-6">
          {previewUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              className="w-32 h-32 object-cover rounded-xl"
            />
          ))}
        </div>
      )}

      <button
        onClick={handlePost}
        disabled={loading || !text.trim()}
        className="w-full max-w-md bg-[#1A2A4F] text-white py-3 rounded-xl text-lg disabled:opacity-50"
      >
        {loading ? "投稿中..." : "投稿する"}
      </button>
    </div>
  );
}
