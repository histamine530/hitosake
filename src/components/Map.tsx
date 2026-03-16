"use client";

import { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
};

export default function Map({ lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Google Maps がまだ読み込まれていない場合
    const g = (window as any).google;
    if (!g) return;

    const map = new g.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
    });

    new g.maps.Marker({
      position: { lat, lng },
      map,
      icon: {
        url: "/izakaya.png",
        scaledSize: new g.maps.Size(40, 40),
      },
    });
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginTop: 10,
      }}
    />
  );
}
