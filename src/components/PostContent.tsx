"use client";

import { useState } from "react";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function PostContent({
  postId,
  post,
  onDeleted,
}: {
  postId: string;
  post: any;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [likeAnim, setLikeAnim] = useState(false);

  const created = post.createdAt?.seconds
    ? new Date(post.createdAt.seconds * 1000).toLocaleString()
    : post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleString()
    : "";

  const toggleLike = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = doc(db, "posts", postId);
    const likes: string[] = post.likes || [];
    const isLiked = likes.includes(uid);

    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 200);

    await updateDoc(ref, {
      likes: isLiked ? arrayRemove(uid) : arrayUnion(uid),
    });
  };

  const deletePost = async () => {
    if (!window.confirm("この投稿を削除しますか？")) return;

    await deleteDoc(doc(db, "posts", postId));

    if (onDeleted) {
      onDeleted();
    } else {
      router.push("/home");
      router.refresh();
    }
  };

  return (
    <div className="mb-8">
      {post.placeName && (
        <h2 className="text-2xl font-bold mb-3 text-[#1A2A4F]">
          {post.placeName}
        </h2>
      )}

      <div className="flex items-center gap-3 mb-4">
        <img
          src={post.userPhoto || "/default.png"}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <div className="font-semibold text-[#1A2A4F]">{post.userName}</div>
          <div className="text-sm text-gray-700">{created}</div>
        </div>
      </div>

      <p className="text-[#1A2A4F] opacity-90 leading-relaxed mb-4 whitespace-pre-line">
        {post.text}
      </p>

      {post.location && (
        <iframe
          width="100%"
          height="250"
          className="rounded-xl shadow-sm mb-4"
          loading="lazy"
          src={`https://www.google.com/maps?q=${post.location.lat},${post.location.lng}&z=16&output=embed`}
        />
      )}

      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={toggleLike}
          className={`text-2xl transition-transform ${
            likeAnim ? "scale-125" : "scale-100"
          }`}
        >
          ❤️ {post.likes?.length || 0}
        </button>

        {auth.currentUser?.uid === post.userId && (
          <button
            onClick={deletePost}
            className="text-gray-400 hover:text-red-500 text-xl transition"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
