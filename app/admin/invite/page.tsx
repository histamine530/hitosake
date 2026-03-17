"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function InvitePage() {
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const handleGenerate = async () => {
    setLoading(true);

    const newCode = generateCode();
    setCode(newCode);

    await addDoc(collection(db, "storeInvites"), {
      code: newCode,
      storeName,
      category,
      prefecture,
      createdAt: Timestamp.now(),
      used: false,
      storeId: null,
    });

    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>店舗招待コード発行</h2>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="店舗名"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="カテゴリ（例：焼き鳥）"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="都道府県"
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
        />
      </div>

      <button
        style={{ marginTop: 20 }}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "発行中..." : "コード発行"}
      </button>

      {code && (
        <div style={{ marginTop: 30 }}>
          <strong>発行されたコード:</strong> {code}
        </div>
      )}
    </div>
  );
}
