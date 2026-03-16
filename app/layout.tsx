export const dynamic = "force-dynamic";

import "./globals.css";
import TabBar from "@/components/TabBar";

export const metadata = {
  title: "HitoSake",
  description: "飲み歩きSNS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          async
        ></script>
      </head>
      <body
        style={{
          margin: 0,
          paddingBottom: 70,
          fontFamily: "sans-serif",
          background: "#fafafa",
        }}
      >
        {children}
        <TabBar />
      </body>
    </html>
  );
}
