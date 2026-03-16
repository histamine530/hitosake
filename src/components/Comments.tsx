"use client";

import { useState } from "react";
import {
  addDoc,
  deleteDoc,
  doc,
  collection,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function Comments({
  postId,
  comments,
  commentText,
  setCommentText,
}: {
  postId: string;
  comments: any[];
  commentText: string;
  setCommentText: (v: string) => void;
}) {
  const [likeAnimId, setLikeAnimId] = useState<string | null>(null);

  const send = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!commentText.trim()) return;

    await addDoc(collection(db, "posts", postId, "comments"), {
      text: commentText,
      userName: user.displayName || "名無し",
      userPhoto: user.photoURL || "/default.png",
      userId: user.uid,
      likes: [],
      createdAt: serverTimestamp(),
    });

    setCommentText("");
  };

  const toggleLike = async (commentId: string, likes: string[]) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = doc(db, "posts", postId, "comments", commentId);
    const isLiked = likes?.includes(uid);

    setLikeAnimId(commentId);
    setTimeout(() => setLikeAnimId(null), 200);

    await updateDoc(ref, {
      likes: isLiked ? arrayRemove(uid) : arrayUnion(uid),
    });
  };

  const remove = async (id: string) => {
    if (!window.confirm("このコメントを削除しますか？")) return;

    await deleteDoc(doc(db, "posts", postId, "comments", id));
  };

  return (
    <div className="flex flex-col gap-5 mt-6">
      <h3 className="font-bold text-[#1A2A4F]">コメント</h3>

      {comments.length === 0 && (
        <p className="text-[#1A2A4F] opacity-70">まだコメントはありません。</p>
      )}

      {comments.map((c) => {
        const created = c.createdAt?.seconds
          ? new Date(c.createdAt.seconds * 1000).toLocaleString()
          : c.createdAt?.toDate
            ? c.createdAt.toDate().toLocaleString()
            : "";

        const userPhoto =
          c.userPhoto && c.userPhoto.trim() !== ""
            ? c.userPhoto
            : "/default.png";

        return (
          <div
            key={c.id}
            className="flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm"
          >
            <img
              src={userPhoto}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div className="flex-1 flex flex-col">
              <p className="font-semibold text-[#1A2A4F]">{c.userName}</p>
              <p className="text-sm text-[#1A2A4F] opacity-90 whitespace-pre-line">
                {c.text}
              </p>
              <p className="text-xs text-gray-600 mt-1">{created}</p>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => toggleLike(c.id, c.likes || [])}
                  className={`
                    text-lg transition-transform
                    ${likeAnimId === c.id ? "scale-125" : "scale-100"}
                  `}
                >
                  ❤️ {c.likes?.length || 0}
                </button>

                {auth.currentUser?.uid === c.userId && (
                  <button
                    onClick={() => remove(c.id)}
                    className="text-gray-400 hover:text-red-500 text-base transition"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex gap-2 mt-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="border p-2 flex-1 rounded"
          placeholder="コメントを入力..."
        />
        <button onClick={send} className="bg-[#1A2A4F] text-white px-4 rounded">
          送信
        </button>
      </div>
    </div>
  );
}
