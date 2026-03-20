import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import TopNavigation from "@/components/TopNavigation";
import BottomNavigation from "@/components/BottomNavigation";
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
  title: "kimpre - 실시간 김치 프리미엄 & 글로벌 코인 정보",
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
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>

        <footer className="w-full border-t border-neutral-800 px-3 md:px-8 py-6 md:py-8">
          <div className="max-w-[1600px] mx-auto space-y-3">
            <p className="text-[10px] md:text-[11px] text-neutral-600 leading-relaxed whitespace-pre-wrap">
              김프리는 사이트 내 모든 암호화폐 가격 및 투자 관련 정보에 대하여 어떠한 책임을 부담하지 않습니다.

              디지털 자산 투자는 전적으로 스스로의 책임이므로 이에 유의하시기 바랍니다.
            </p>

            <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-neutral-500">
              <Link href="/terms" className="hover:text-neutral-300 transition-colors font-bold">
                서비스 이용약관
              </Link>
              <span aria-hidden="true" className="text-neutral-700">|</span>
              <Link href="/privacy" className="hover:text-neutral-300 transition-colors font-bold">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </footer>
        <BottomNavigation />
      </body>
    </html>
  );
}
