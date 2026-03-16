"use client";

import {
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";
import { getAuth } from "firebase/auth";

export default function PostContent({
  postId,
  post,
  onDeleted,
}: {
  postId: string;
  post: any;
  onDeleted?: () => void;
}) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [likeAnim, setLikeAnim] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLiked = user && post.likes?.includes(user.uid);

  // ❤️ いいね
  const toggleLike = async () => {
    if (!user) return;

    const ref = doc(db, "posts", postId);

    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 200);

    await updateDoc(ref, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  // 🗑️ 削除
  const handleDelete = async () => {
    if (!confirm("本当に削除しますか？")) return;

    setDeleting(true);
    await deleteDoc(doc(db, "posts", postId));

    if (onDeleted) onDeleted();
  };

  return (
    <div className="mt-4">
      {/* テキスト */}
      <p className="text-[#1A2A4F] whitespace-pre-wrap mb-4">{post.text}</p>

      {/* ❤️ いいね */}
      <button
        onClick={toggleLike}
        className={`
          text-xl w-fit transition-transform
          ${likeAnim ? "scale-125" : "scale-100"}
        `}
      >
        ❤️ {post.likes?.length || 0}
      </button>

      {/* 🗑️ 削除（投稿者本人のみ） */}
      {user?.uid === post.userId && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-400 hover:text-red-500 text-xs transition w-fit block mt-1 disabled:opacity-50"
        >
          🗑️
        </button>
      )}
    </div>
  );
}
