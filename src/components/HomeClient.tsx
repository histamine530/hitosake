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

export default function HomeClient() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const list = [];

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
        <div key={post.docId} style={{ marginBottom: 30, padding: 20 }}>
          {/* ... ここはそのまま ... */}
        </div>
      ))}
    </div>
  );
}
