"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

export default function StoreDashboard() {
  const storeId = auth.currentUser?.uid;
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchStatus = async () => {
      if (!storeId) return;
      const ref = doc(db, "stores", storeId, "status", "current");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setStatus(snap.data().status);
      }
    };
    fetchStatus();
  }, [storeId]);

  const updateStatus = async (newStatus: string) => {
    if (!storeId) return;

    const ref = doc(db, "stores", storeId, "status", "current");

    await setDoc(ref, {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    setStatus(newStatus);
  };

  const buttonStyle = {
    width: "100%",
    padding: "16px",
    fontSize: "18px",
    borderRadius: "12px",
    border: "none",
    marginTop: "12px",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>空席状況</h2>

      <div
        style={{
          padding: "16px",
          background: "#f5f5f5",
          borderRadius: "12px",
          marginBottom: "24px",
          fontSize: "18px",
        }}
      >
        <strong>現在の状態：</strong>
        {status || "未設定"}
      </div>

      <button
        style={{
          ...buttonStyle,
          background: "#4CAF50",
          color: "white",
        }}
        onClick={() => updateStatus("空席あり")}
      >
        空席あり
      </button>

      <button
        style={{
          ...buttonStyle,
          background: "#F44336",
          color: "white",
        }}
        onClick={() => updateStatus("満席")}
      >
        満席
      </button>

      <button
        style={{
          ...buttonStyle,
          background: "#FF9800",
          color: "white",
        }}
        onClick={() => updateStatus("30分だけ入れます")}
      >
        30分だけ入れます
      </button>
    </div>
  );
}
