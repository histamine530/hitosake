"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
} from "firebase/firestore";
import Map from "@/components/Map";
import type { User } from "firebase/auth";

type Post = {
  docId: string;
  text?: string;
  photoURL?: string;
  location?: { lat: number; lng: number };
  createdAt?: any;
  uid?: string;
  user: any | null; // Firestore の user データ
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  // ログイン状態を監視
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 投稿一覧 + 投稿者情報を取得
  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const list = [];

      for (const docSnap of snap.docs) {
        const post = docSnap.data();

        // uid が無い投稿はスキップ
        if (!post.uid) continue;

        // 投稿者情報を取得
        const userRef = doc(db, "users", post.uid);
        const userSnap = await getDoc(userRef);

        list.push({
          ...post,
          docId: docSnap.id, // ← Firestore のドキュメントID（ユニーク）
          user: userSnap.exists() ? userSnap.data() : null,
        });
      }

      setPosts(list);
    };

    fetchPosts();
  }, []);

  return (
    <div style={{ padding: 40 }}>
    <a href="/map" style={{ marginRight: 20, fontWeight: "bold" }}>
      みんなの飲んだ場所マップ
    </a>

    <h2>タイムライン</h2>

      {posts.map((post) => (
        <div
          key={post.docId}
          style={{
            marginBottom: 30,
            padding: 20,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        >
          {/* 投稿者情報 */}
          {post.user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <img
                src={post.user.photoURL}
                alt="icon"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  marginRight: 10,
                }}
              />
              <strong>{post.user.name}</strong>
            </div>
          )}

          {/* テキスト */}
          <p>{post.text}</p>

          {/* 写真 */}
          {post.photoURL && (
            <img
              src={post.photoURL}
              alt="photo"
              style={{
                width: "100%",
                maxWidth: 400,
                borderRadius: 8,
                marginTop: 10,
              }}
            />
          )}

          {/* ★ 地図（位置情報がある投稿だけ表示） */}
          {post.location && (
            <Map lat={post.location.lat} lng={post.location.lng} />
          )}

          {/* 投稿日時 */}
          <p style={{ fontSize: 12, color: "#666", marginTop: 10 }}>
            {post.createdAt?.toDate
              ? post.createdAt.toDate().toLocaleString()
              : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

