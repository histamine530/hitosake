"use client";

import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";

export default function PostContent({
  postId,
  post,
  onDeleted, // ← 追加
}: {
  postId: string;
  post: any;
  onDeleted?: () => void; // ← 追加
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("本当に削除しますか？")) return;

    setDeleting(true);

    await deleteDoc(doc(db, "posts", postId));

    // 🔥 削除後に親コンポーネントへ通知
    if (onDeleted) onDeleted();
  };

  return (
    <div className="mt-4">
      <p className="text-[#1A2A4F] whitespace-pre-wrap mb-4">{post.text}</p>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
      >
        {deleting ? "削除中…" : "削除する"}
      </button>
    </div>
  );
}
