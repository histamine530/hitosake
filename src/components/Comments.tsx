"use client";

import { useState, useEffect } from "react";
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
import Link from "next/link";

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
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const send = async () => {
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
    const uid = user?.uid;
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
    <div className="flex flex-col gap-5 mt-6 text-[#1A2A4F] [color:#1A2A4F] [-webkit-text-fill-color:#1A2A4F]">
      <h3 className="font-bold">コメント</h3>

      {comments.length === 0 && (
        <p className="opacity-70">まだコメントはありません。</p>
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
              <p className="font-semibold">{c.userName}</p>
              <p className="text-sm opacity-90 whitespace-pre-line">{c.text}</p>
              <p className="text-xs text-gray-600 mt-1">{created}</p>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => toggleLike(c.id, c.likes || [])}
                  className={`
                    text-lg transition-transform
                    ${likeAnimId === c.id ? "scale-125" : "scale-100"}
                    text-[#E63946] [color:#E63946] [-webkit-text-fill-color:#E63946]
                  `}
                >
                  ❤️ {c.likes?.length || 0}
                </button>

                {user?.uid === c.userId && (
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

      {!user && (
        <div className="text-center mt-4">
          <p className="opacity-80 mb-3">
            コメントするにはログインが必要です。
          </p>
          <Link href="/login">
            <button className="px-5 py-2 bg-[#1A2A4F] text-white rounded-lg shadow">
              ログインする
            </button>
          </Link>
        </div>
      )}

      {user && (
        <div className="flex gap-2 mt-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="
              border p-2 flex-1 rounded
              text-[#1A2A4F] [color:#1A2A4F] [-webkit-text-fill-color:#1A2A4F]
              placeholder-[#1A2A4F]/40
              appearance-none
            "
            placeholder="コメントを入力..."
          />
          <button
            onClick={send}
            className="
    bg-[#1A2A4F]
    text-white
    [-webkit-text-fill-color:white]
    [color:white]
    px-4 rounded
  "
          >
            送信
          </button>
        </div>
      )}
    </div>
  );
}
