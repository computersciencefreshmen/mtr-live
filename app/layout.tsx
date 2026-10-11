import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTR Live | 港鐵實時到站",
  description: "查詢港鐵 10 條鐵路綫官方實時到站資料。儲存常駐車站、搜尋或隨機選站，以車站到站屏查看列車、月台與預計時間，每 10 秒更新。",
  icons: { icon: "/assets/mtr-logo.png", apple: "/assets/mtr-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
