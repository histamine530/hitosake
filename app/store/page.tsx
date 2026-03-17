"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";

// 店舗データの型
type Store = {
  id: string;
  name?: string;
  category?: string;
  prefecture?: string;
  status?: string;
  updatedAt?: any; // Firestore Timestamp
};

export default function StoreList() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const fetchStores = async () => {
      const snap = await getDocs(collection(db, "stores"));
      const storeList: Store[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // 各店舗の status をリアルタイム購読
      storeList.forEach((store) => {
        const statusRef = doc(db, "stores", store.id, "status", "current");

        onSnapshot(statusRef, (statusSnap) => {
          const statusData = statusSnap.data();

          setStores((prev) =>
            prev.map((s) =>
              s.id === store.id
                ? {
                    ...s,
                    status: statusData?.status,
                    updatedAt: statusData?.updatedAt,
                  }
                : s,
            ),
          );
        });
      });

      setStores(storeList);
    };

    fetchStores();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>お店一覧</h2>

      {stores.map((store) => (
        <div
          key={store.id}
          style={{
            padding: 16,
            marginTop: 16,
            borderRadius: 12,
            background: "#f5f5f5",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: "bold" }}>{store.name}</div>
          <div>
            {store.category} / {store.prefecture}
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>空席状況：</strong>
            {store.status || "未設定"}
          </div>

          {store.updatedAt && (
            <div style={{ fontSize: 12, marginTop: 4 }}>
              更新：{store.updatedAt.toDate().toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
