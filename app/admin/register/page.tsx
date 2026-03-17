"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function StoreRegister() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    try {
      // ① 招待コードを検索
      const q = query(
        collection(db, "storeInvites"),
        where("code", "==", inviteCode),
        where("used", "==", false),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("招待コードが無効です");
        return;
      }

      const inviteDoc = snap.docs[0];
      const inviteData = inviteDoc.data();

      // ② Firebase Auth にユーザー作成
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // ③ stores に店舗データ作成
      await setDoc(doc(db, "stores", userCred.user.uid), {
        name: inviteData.storeName,
        category: inviteData.category,
        prefecture: inviteData.prefecture,
        ownerUid: userCred.user.uid,
        createdAt: new Date(),
      });

      // ④ 招待コードを used = true に更新
      await setDoc(
        doc(db, "storeInvites", inviteDoc.id),
        { used: true, storeId: userCred.user.uid },
        { merge: true },
      );

      router.push("/admin/dashboard");
    } catch (e) {
      setError("登録に失敗しました");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>店舗アカウント作成</h2>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="招待コード"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
        />
      </div>

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

      <button style={{ marginTop: 20 }} onClick={handleRegister}>
        アカウント作成
      </button>

      {error && <div style={{ color: "red", marginTop: 20 }}>{error}</div>}
    </div>
  );
}
