import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
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

const SITE_URL = "https://kimpre.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "김프리 - 실시간 김치프리미엄 · 코인 시세 · 롱숏비율",
    template: "%s | 김프리",
  },
  description:
    "실시간 김프가(김치프리미엄)를 업비트·빗썸·바이낸스 기준으로 제공합니다. 코인 롱숏비율, 고래거래, 청산 감지, 공포탐욕지수, 글로벌 시총 등 암호화폐 투자에 필요한 핵심 지표를 한눈에 확인하세요.",
  keywords: [
    "김프",
    "김치프리미엄",
    "김프가",
    "김프 실시간",
    "코인 김프",
    "비트코인 김프",
    "업비트 김프",
    "빗썸 김프",
    "바이낸스 김프",
    "코인 롱숏비율",
    "롱숏 비율",
    "코인 청산",
    "암호화폐 청산 알림",
    "고래 거래",
    "코인 시세",
    "비트코인 시세",
    "업비트 시세",
    "공포탐욕지수",
    "BTC 도미넌스",
    "암호화폐 투자",
    "코인 투자",
    "실시간 코인",
    "kimchi premium",
    "crypto premium",
    "kimpre",
    "김프리",
  ],
  authors: [{ name: "김프리" }],
  creator: "김프리",
  publisher: "김프리",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "김프리",
    title: "김프리 - 실시간 김치프리미엄 · 코인 시세 · 롱숏비율",
    description:
      "업비트·빗썸·바이낸스 기준 실시간 김프가(김치프리미엄), 코인 롱숏비율, 고래거래, 청산 감지를 한눈에 확인하세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "김프리 - 실시간 김치프리미엄 대시보드",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "김프리 - 실시간 김치프리미엄 · 코인 시세 · 롱숏비율",
    description:
      "업비트·빗썸·바이낸스 실시간 김프가, 코인 롱숏비율, 고래거래, 청산 알림을 무료로 확인하세요.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "sYZoVyLmX3fTYrVRhBW1Vs93KKfL1IhU_q6sdU7wZ5Y",
  },
  other: {
    "google-adsense-account": "ca-pub-9754221047620946",
  },
};

// 구조화 데이터 (JSON-LD) — 검색엔진이 사이트 용도를 명확히 이해
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "김프리",
  url: SITE_URL,
  description:
    "실시간 김치프리미엄(김프가), 코인 롱숏비율, 고래거래, 청산 감지, 공포탐욕지수 등 암호화폐 투자 핵심 지표 대시보드",
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  inLanguage: "ko",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  featureList: [
    "실시간 김치프리미엄(김프)",
    "업비트 빗썸 바이낸스 시세 비교",
    "코인 롱숏비율",
    "고래 거래 감지",
    "청산 알림",
    "공포탐욕지수",
    "BTC 도미넌스",
    "글로벌 시가총액",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-neutral-300 min-h-screen flex flex-col font-sans`}>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9754221047620946"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <TopNavigation />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>

        <footer className="w-full border-t border-neutral-800 px-3 md:px-8 pt-6 pb-24 md:pt-8 md:pb-8">
          <div className="max-w-[1600px] mx-auto space-y-3">
            {/* SEO용 키워드 텍스트 (자연스럽게 서비스 설명) */}
            <p className="text-xs md:text-sm text-neutral-600 leading-relaxed">
              김프리는 실시간 <strong className="text-neutral-500">김치프리미엄(김프가)</strong>을 업비트·빗썸·바이낸스 기준으로 비교 제공합니다.
              코인별 <strong className="text-neutral-500">롱숏비율</strong>, 고래 거래, 청산 감지, BTC 도미넌스, 공포탐욕지수를 한눈에 확인하세요.
            </p>
            <p className="text-xs md:text-sm text-neutral-600 leading-relaxed">
              사이트 내 모든 암호화폐 가격 및 투자 관련 정보에 대하여 어떠한 책임을 부담하지 않습니다.
              디지털 자산 투자는 전적으로 스스로의 책임이므로 이에 유의하시기 바랍니다.
            </p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-500">
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
