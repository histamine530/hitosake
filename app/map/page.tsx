"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { renderToString } from "react-dom/server";
import HitoSakeCard from "@/components/HitoSakeCard";

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const router = useRouter();

  // Firestore リアルタイム取得
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posts"), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(list);
    });

    return () => unsub();
  }, []);

  // Google Map 初期化
  useEffect(() => {
    if (!mapRef.current) return;
    if (!(window as any).google) return;

    mapInstance.current = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 35.6895, lng: 139.6917 },
      zoom: 14,
      disableDefaultUI: true,
    });
  }, []);

  // マーカー描画
  useEffect(() => {
    if (!mapInstance.current) return;
    if (!(window as any).google) return;

    // 既存マーカー削除
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    posts.forEach((p) => {
      if (!p.location) return;

      const marker = new (window as any).google.maps.Marker({
        position: {
          lat: p.location.lat,
          lng: p.location.lng,
        },
        map: mapInstance.current,
      });

      markersRef.current.push(marker);

      // InfoWindow の中身（カード + ボタン）
      const html = renderToString(
        <div style={{ width: "240px" }}>
          <HitoSakeCard
            images={p.images || []}
            placeName={p.placeName}
            text={p.text}
            userPhoto={p.userPhoto}
            userName={p.userName}
            createdAt={p.createdAt}
          />
          <button
            id={`detail-${p.id}`}
            style={{
              marginTop: "8px",
              padding: "6px 10px",
              background: "#1A2A4F",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            詳細を見る
          </button>
        </div>,
      );

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: html,
      });

      marker.addListener("click", () => {
        infoWindow.open({
          anchor: marker,
          map: mapInstance.current!,
        });

        setTimeout(() => {
          const btn = document.getElementById(`detail-${p.id}`);
          if (btn) btn.onclick = () => router.push(`/post/${p.id}`);
        }, 100);
      });
    });
  }, [posts]);

  // 📍 現在地に移動する関数
  const handleMoveToCurrentLocation = () => {
    if (!mapInstance.current) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      mapInstance.current.setCenter(loc);
      mapInstance.current.setZoom(16);

      // 現在地マーカー（HitoSake カラー）
      new (window as any).google.maps.Marker({
        map: mapInstance.current,
        position: loc,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#1A2A4F",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "white",
        },
      });
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-5">
      <h2 className="text-xl font-bold text-[#1A2A4F] opacity-90 mb-4">
        マップ
      </h2>

      {/* マップ + 現在地ボタン */}
      <div className="relative" style={{ width: "100%", height: "70vh" }}>
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
          }}
        />

        {/* 📍 現在地ボタン */}
        <button
          onClick={handleMoveToCurrentLocation}
          className="absolute bottom-4 right-4 bg-white shadow-lg rounded-full p-3 z-10 text-[#1A2A4F]"
        >
          📍
        </button>
      </div>
    </div>
  );
}
