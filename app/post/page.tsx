"use client";
export const dynamic = "force-dynamic";

// -----------------------------
// 距離計算（既存）
// -----------------------------
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

// -----------------------------
// LatLng の取得を統一する関数
// -----------------------------
const getLatLng = (place: any) => {
  const loc = place.geometry?.location;
  if (!loc) return null;

  const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;

  return { lat, lng };
};

import { useState, useEffect, useRef } from "react";
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

  // 🔍 店名検索
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // 🗺️ ミニマップ
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  // 🔘 店選択 UI の表示制御
  const [placeUIVisible, setPlaceUIVisible] = useState(false);

  // 🔘 店一覧アコーディオン
  const [showPlaceList, setShowPlaceList] = useState(true);

  // 🏷️ InfoWindow（店名ラベル）
  const infoWindowRef = useRef<any>(null);

  // -----------------------------
  // 🔐 Auth
  // -----------------------------
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // -----------------------------
  // 📍 現在地取得 → map を先に作る
  // -----------------------------
  useEffect(() => {
    if (!placeUIVisible) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setLocation(loc);

      if (!(window as any).google || !mapRef.current) return;

      const m = new (window as any).google.maps.Map(mapRef.current, {
        center: loc,
        zoom: 15,
        disableDefaultUI: true,
      });

      setMap(m);
    });
  }, [placeUIVisible]);

  // -----------------------------
  // 🗺️ places が更新されたらピンを置く
  // -----------------------------
  useEffect(() => {
    if (!map) return;

    // 既存ピン削除
    mapMarkers.forEach((m) => m.setMap(null));

    const newMarkers: any[] = [];

    places.forEach((p) => {
      const ll = getLatLng(p);
      if (!ll) return;

      const marker = new (window as any).google.maps.Marker({
        map,
        position: ll,
      });

      // 店名ラベル
      const info = new (window as any).google.maps.InfoWindow({
        content: `<div style="font-size:14px;color:#1A2A4F;">${p.name}</div>`,
      });

      marker.addListener("click", () => {
        infoWindowRef.current?.close();
        info.open(map, marker);
        infoWindowRef.current = info;

        setSelectedPlace(p);
        setShowPlaceList(false);
      });

      newMarkers.push(marker);
    });

    setMapMarkers(newMarkers);
  }, [map, places]);

  // -----------------------------
  // 🔍 店名検索（サジェスト）
  // -----------------------------
  useEffect(() => {
    if (!placeUIVisible) return;
    if (!searchText) {
      setSuggestions([]);
      return;
    }
    if (!(window as any).google || !location) return;

    const service = new (window as any).google.maps.places.PlacesService(
      document.createElement("div"),
    );

    const t = setTimeout(() => {
      service.textSearch(
        {
          query: searchText,
          location: new (window as any).google.maps.LatLng(
            location.lat,
            location.lng,
          ),
          radius: 1000,
        },
        (results: any, status: any) => {
          if (status === "OK") {
            setSuggestions(results);
          }
        },
      );
    }, 300);

    return () => clearTimeout(t);
  }, [searchText, location, placeUIVisible]);

  // -----------------------------
  // 📍 近くのお店を探す
  // -----------------------------
  const getLocationAndPlaces = () => {
    setPlaceUIVisible(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setLocation(loc);

      if (!(window as any).google) return;

      const mapObj = new (window as any).google.maps.Map(
        document.createElement("div"),
        {
          center: loc,
          zoom: 15,
        },
      );

      const service = new (window as any).google.maps.places.PlacesService(
        mapObj,
      );

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
        await new Promise<void>((resolve) => {
          service.textSearch(
            {
              query: q,
              location: new (window as any).google.maps.LatLng(
                loc.lat,
                loc.lng,
              ),
              radius: 500,
            },
            (results: any, status: any) => {
              if (status === "OK" && results) {
                allResults.push(...results);
              }
              resolve();
            },
          );
        });
      }

      const unique = Array.from(
        new Map(allResults.map((p) => [p.place_id, p])).values(),
      );

      const filtered = unique.filter((p: any) => {
        const ll = getLatLng(p);
        if (!ll) return false;
        const d = getDistance(loc.lat, loc.lng, ll.lat, ll.lng);
        return d <= 500;
      });

      if (filtered.length === 0) {
        setPlaces([]);
        setPlaceError("近くにお店が見つかりませんでした");
        return;
      }

      setPlaces(filtered);
      setPlaceError("");
      setShowPlaceList(true);
    });
  };

  // -----------------------------
  // 🔍 サジェスト選択時の処理
  // -----------------------------
  const handleSelectSuggestion = (place: any) => {
    setSelectedPlace(place);
    setSuggestions([]);
    setSearchText(place.name);
    setShowPlaceList(false);

    const ll = getLatLng(place);
    if (ll && map) {
      map.setCenter(ll);
      map.setZoom(17);
    }

    // 既存ピン削除
    mapMarkers.forEach((m) => m.setMap(null));

    // 新しいピン
    const marker = new (window as any).google.maps.Marker({
      map,
      position: ll,
    });

    // 店名ラベル
    const info = new (window as any).google.maps.InfoWindow({
      content: `<div style="font-size:14px;color:#1A2A4F;">${place.name}</div>`,
    });

    infoWindowRef.current?.close();
    info.open(map, marker);
    infoWindowRef.current = info;

    setMapMarkers([marker]);
  };

  // -----------------------------
  // 📝 投稿処理（既存）
  // -----------------------------
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
      location: selectedPlace ? getLatLng(selectedPlace) : null,
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

  // -----------------------------
  // UI
  // -----------------------------
  if (loading) {
    return (
      <div className="p-5">
        <h2 className="text-xl font-bold text-[#1A2A4F]">今日の一杯を投稿</h2>
        <p className="text-[#1A2A4F]">読み込み中…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-5 text-center">
        <h2 className="text-xl font-bold text-[#1A2A4F] mb-4">
          今日の一杯を投稿
        </h2>
        <p className="text-[#1A2A4F] mb-6">投稿するにはログインが必要です。</p>

        <Link href="/login">
          <button className="px-5 py-3 bg-[#1A2A4F] text-white rounded-xl shadow">
            ログインする
          </button>
        </Link>
      </div>
    );
  }

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
                   placeholder:text-gray-500
                   focus:outline-none focus:ring-2 focus:ring-[#1A2A4F]
                   mb-4"
        rows={4}
      />

      {/* 近くのお店を探す */}
      <button
        onClick={getLocationAndPlaces}
        className="w-full py-3 rounded-lg bg-[#1A2A4F] text-white font-semibold
                   hover:bg-[#16213d] transition mb-4"
      >
        近くのお店を探す
      </button>

      {/* 🔽 店選択 UI */}
      {placeUIVisible && (
        <>
          {/* 🔍 店名検索バー */}
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="店名で検索…"
            className="w-full p-3 rounded-lg shadow bg-white text-[#1A2A4F] placeholder:text-gray-500 mb-2"
          />

          {/* 🔍 サジェスト */}
          {suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-4">
              {suggestions.map((s) => (
                <div
                  key={s.place_id}
                  onClick={() => handleSelectSuggestion(s)}
                  className="p-3 border-b last:border-none cursor-pointer hover:bg-gray-100 text-[#1A2A4F]"
                >
                  {s.name}
                </div>
              ))}
            </div>
          )}

          {/* 🗺️ カード風ミニマップ */}
          <div
            ref={mapRef}
            className="w-full h-56 rounded-xl shadow mb-4 bg-gray-200"
          />

          {/* 選択された店 */}
          {selectedPlace && (
            <div className="p-3 bg-white rounded-lg shadow text-[#1A2A4F] mb-4">
              選択された店：{selectedPlace.name}
            </div>
          )}

          {/* 店一覧アコーディオン */}
          {places.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowPlaceList(!showPlaceList)}
                className="text-[#1A2A4F] underline mb-2"
              >
                {showPlaceList ? "お店一覧を閉じる" : "他のお店を選ぶ"}
              </button>

              {showPlaceList && (
                <div className="space-y-2 mt-2">
                  {places.map((p) => (
                    <button
                      key={p.place_id}
                      onClick={() => {
                        setSelectedPlace(p);
                        setShowPlaceList(false);

                        const ll = getLatLng(p);
                        if (ll && map) {
                          map.setCenter(ll);
                          map.setZoom(17);
                        }

                        // ラベル表示
                        infoWindowRef.current?.close();
                        const info = new (window as any).google.maps.InfoWindow(
                          {
                            content: `<div style="font-size:14px;color:#1A2A4F;">${p.name}</div>`,
                          },
                        );
                        info.open(
                          map,
                          mapMarkers.find((m) => {
                            const pos = m.getPosition();
                            return pos.lat() === ll.lat && pos.lng() === ll.lng;
                          }),
                        );
                        infoWindowRef.current = info;
                      }}
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
              )}
            </div>
          )}
        </>
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
