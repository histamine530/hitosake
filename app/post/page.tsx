"use client";
export const dynamic = "force-dynamic";

// ←←← ここに追加（最重要）
// 距離計算関数（グローバルに置く）
const getDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
// ←←← ここまで追加

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function PostPage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [placeError, setPlaceError] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // 🔐 Auth 状態取得
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 📍 位置情報取得 → textSearch（複数カテゴリ）＋距離フィルタリング
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setLocation(loc);

      if (!(window as any).google) return;

      const map = new (window as any).google.maps.Map(
        document.createElement("div"),
        {
          center: loc,
          zoom: 15,
        },
      );

      const service = new (window as any).google.maps.places.PlacesService(map);

      const queries = [
        "居酒屋",
        "バー",
        "飲み屋",
        "酒場",
        "レストラン",
        "カフェ",
        "食堂",
        "定食",
        "ラーメン",
        "焼肉",
        "寿司",
        "蕎麦",
        "うどん",
      ];

      const allResults: any[] = [];

      for (const q of queries) {
        const request = {
          query: q,
          location: new (window as any).google.maps.LatLng(loc.lat, loc.lng),
          radius: 500,
        };

        await new Promise<void>((resolve) => {
          service.textSearch(request, (results: any, status: any) => {
            if (status === "OK" && results) {
              allResults.push(...results);
            }
            resolve();
          });
        });
      }

      const unique = Array.from(
        new Map(allResults.map((p) => [p.place_id, p])).values(),
      );

      const filtered = unique.filter((p: any) => {
        const lat = p.geometry.location.lat();
        const lng = p.geometry.location.lng();
        const d = getDistance(loc.lat, loc.lng, lat, lng);
        return d <= 500;
      });

      if (filtered.length === 0) {
        setPlaces([]);
        setPlaceError("近くにお店が見つかりませんでした");
        return;
      }

      setPlaces(filtered);
      setPlaceError("");
    });
  };

  // 📝 投稿処理（lat/lng を関数呼び出しに修正）
  const handlePost = async () => {
    if (!user || posting) return;

    setPosting(true);

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const profile = snap.data();

    let imageUrls: string[] = [];

    for (const file of files) {
      const fileRef = ref(storage, `images/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      imageUrls.push(url);
    }

    await addDoc(collection(db, "posts"), {
      text,
      images: imageUrls,
      location: selectedPlace
        ? {
            lat: selectedPlace.geometry.location.lat(),
            lng: selectedPlace.geometry.location.lng(),
          }
        : null,
      placeName: selectedPlace?.name ?? "",
      placeId: selectedPlace?.place_id ?? "",
      userName: profile?.userName ?? "",
      userPhoto: profile?.userPhoto ?? "",
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    setText("");
    setFiles([]);
    setPosting(false);
  };

  // 🔄 読み込み中
  if (loading) {
    return (
      <div className="p-5">
        <h2 className="text-xl font-bold text-[#1A2A4F]">今日の一杯を投稿</h2>
        <p className="text-[#1A2A4F] opacity-80">読み込み中…</p>
      </div>
    );
  }

  // 🔐 未ログイン
  if (!user) {
    return (
      <div className="p-5 text-center">
        <h2 className="text-xl font-bold text-[#1A2A4F] mb-4">
          今日の一杯を投稿
        </h2>
        <p className="text-[#1A2A4F] opacity-80 mb-6">
          投稿するにはログインが必要です。
        </p>

        <Link href="/login">
          <button className="px-5 py-3 bg-[#1A2A4F] text-white rounded-xl shadow">
            ログインする
          </button>
        </Link>
      </div>
    );
  }

  // 🔓 投稿フォーム
  return (
    <div className="p-5 bg-[#FAF7F2] min-h-screen">
      <h2 className="text-xl font-bold mb-5 text-[#1A2A4F]">
        今日の一杯を投稿
      </h2>

      {/* 画像アップロード */}
      <div className="mb-4">
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="block w-full text-sm text-gray-700
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-semibold
                     file:bg-[#1A2A4F] file:text-white
                     hover:file:bg-[#16213d]"
        />
      </div>

      {/* メモ */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="今日の一杯のメモ"
        className="w-full p-3 rounded-lg border border-gray-300
                   bg-white text-[#1A2A4F]
                   placeholder:text-gray-400
                   focus:text-[#1A2A4F]
                   focus:placeholder:text-gray-300
                   focus:outline-none focus:ring-2 focus:ring-[#1A2A4F]
                   mb-4"
        rows={4}
      />

      {/* 位置情報 */}
      <button
        onClick={getLocation}
        className="w-full py-3 rounded-lg bg-[#1A2A4F] text-white font-semibold
                   hover:bg-[#16213d] transition mb-4"
      >
        近くのお店を探す
      </button>

      {/* 店が見つからなかった時 */}
      {placeError && (
        <p className="text-center text-red-600 font-semibold mb-4">
          {placeError}
        </p>
      )}

      {/* 店リスト */}
      {places.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-[#1A2A4F] mb-2">お店を選択</h3>
          <div className="space-y-2">
            {places.map((p) => (
              <button
                key={p.place_id}
                onClick={() => setSelectedPlace(p)}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedPlace?.place_id === p.place_id
                    ? "bg-[#1A2A4F] text-white"
                    : "bg-white text-[#1A2A4F]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 投稿ボタン */}
      <button
        onClick={handlePost}
        disabled={posting}
        className="w-full py-3 rounded-lg bg-[#1A2A4F] text-white font-semibold
                   hover:bg-[#16213d] transition disabled:opacity-50"
      >
        {posting ? "投稿中…" : "投稿する"}
      </button>
    </div>
  );
}
