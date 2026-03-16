"use client";

import { useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function NewPostPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  // ★ 位置情報を取得
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("位置情報が使えません");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        alert("位置情報を取得しました！");
      },
      () => {
        alert("位置情報の取得に失敗しました");
      }
    );
  };

  const submitPost = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("ログインしてください");
      return;
    }

    const postId = crypto.randomUUID();
    let photoURL = "";

    // ★ 写真アップロード
    if (file) {
      const storageRef = ref(storage, `posts/${postId}`);
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
    }

    // ★ Firestore に保存
    await setDoc(doc(db, "posts", postId), {
      id: postId,
      uid: user.uid,
      text: text,
      photoURL: photoURL || null,
      location: location || null, // ← 追加
      createdAt: new Date(),
    });

    alert("投稿しました！");
    router.push("/home");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>新しい投稿</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="飲んだ内容やコメントを書いてね"
        style={{
          width: "100%",
          height: 120,
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      <div style={{ marginTop: 20 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      {/* ★ 位置情報ボタン */}
      <button
        onClick={getLocation}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          background: "#4CAF50",
          color: "white",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
      >
        位置情報を取得する
      </button>

      {location && (
        <p style={{ marginTop: 10, fontSize: 12 }}>
          緯度: {location.lat}, 経度: {location.lng}
        </p>
      )}

      <button
        onClick={submitPost}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          background: "#4285F4",
          color: "white",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
      >
        投稿する
      </button>
    </div>
  );
}

