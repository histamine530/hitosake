"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function StoreLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch (e) {
      setError("ログインに失敗しました");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>店舗ログイン</h2>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button style={{ marginTop: 20 }} onClick={handleLogin}>
        ログイン
      </button>

      {error && <div style={{ color: "red", marginTop: 20 }}>{error}</div>}
    </div>
  );
}
