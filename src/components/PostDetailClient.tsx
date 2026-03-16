"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import PostImages from "@/components/PostImages";
import PostContent from "@/components/PostContent";
import Comments from "@/components/Comments";
import { useRouter } from "next/navigation";

export default function PostDetailClient({ id }: { id: string }) {
  const [post, setPost] = useState<any | null>(undefined); // ← undefined と null を区別
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const router = useRouter();

  // 投稿本体
  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "posts", id), (snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      } else {
        // 削除されたら post=null にする（UIは描画しない）
        setPost(null);
      }
    });

    return () => unsub();
  }, [id]);

  // コメント
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "posts", id, "comments"),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(list);
    });

    return () => unsub();
  }, [id]);

  // 🔥 削除された直後は何も描画しない（これが重要）
  if (post === null) return null;

  // 初回読み込み中だけ表示
  if (post === undefined)
    return <p className="p-5 text-[#1A2A4F] opacity-80">読み込み中...</p>;

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-5">
      {Array.isArray(post.images) && post.images.length > 0 && (
        <PostImages images={post.images} />
      )}

      <PostContent
        postId={id}
        post={post}
        onDeleted={() => {
          router.back();
        }}
      />

      <Comments
        postId={id}
        comments={comments}
        commentText={commentText}
        setCommentText={setCommentText}
      />
    </div>
  );
}
