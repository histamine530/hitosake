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
  user: any | null;
};

export default function HomeClient() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const list: Post[] = [];

      for (const docSnap of snap.docs) {
        const post = docSnap.data();
        if (!post.uid) continue;

        const userRef = doc(db, "users", post.uid);
        const userSnap = await getDoc(userRef);

        list.push({
          ...post,
          docId: docSnap.id,
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

          <p>{post.text}</p>

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

          {post.location && (
            <Map lat={post.location.lat} lng={post.location.lng} />
          )}

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
