export const dynamic = "force-dynamic";

import "./globals.css";
import TabBar from "@/components/TabBar";
import Script from "next/script";

export const metadata = {
  title: "HitoSake",
  description: "飲み歩きSNS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          paddingBottom: 70,
          fontFamily: "sans-serif",
          background: "#fafafa",
        }}
      >
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
        />
        {children}
        <TabBar />
      </body>
    </html>
  );
}
