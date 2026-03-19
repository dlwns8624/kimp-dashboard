import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TopNavigation from "@/components/TopNavigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "트렌딩 트라이브 - 실시간 김치 프리미엄 & 글로벌 코인 정보",
  description: "업비트, 빗썸, 바이낸스의 실시간 시세를 추적하고 코인별 김치 프리미엄과 롱/숏 비율, 청산 알림을 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-neutral-300 min-h-screen flex flex-col`}>
        <TopNavigation />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
