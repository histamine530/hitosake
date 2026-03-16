"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabBar() {
  const pathname = usePathname();

  const tabStyle = (path: string): React.CSSProperties => ({
    textAlign: "center",
    fontSize: 12,
    textDecoration: "none",
    lineHeight: 1.2,
    color: pathname === path ? "#1A2A4F" : "#666",
    fontWeight: pathname === path ? "600" : "400",
  });

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 60,
        background: "#ffffff",
        borderTop: "1px solid #ddd",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <Link href="/" style={tabStyle("/")}>
        🏠
        <br />
        ホーム
      </Link>
      <Link href="/post" style={tabStyle("/post")}>
        ➕<br />
        投稿
      </Link>
      <Link href="/map" style={tabStyle("/map")}>
        🗺️
        <br />
        マップ
      </Link>
      <Link href="/profile" style={tabStyle("/profile")}>
        👤
        <br />
        プロフィール
      </Link>
    </nav>
  );
}
