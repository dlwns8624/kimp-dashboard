"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const TradingViewSingleQuote = dynamic(() => import("@/components/TradingViewSingleQuote"), { ssr: false });
const TradingViewMarketWidget = dynamic(() => import("@/components/TradingViewMarketWidget"), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-neutral-900 animate-pulse rounded-2xl" />,
});

// ── 탭 정의 ─────────────────────────────────────────────────────────────────
type TabKey = "overview" | "stocks" | "commodities" | "forex" | "crypto";

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "overview",    label: "시장 차트",  emoji: "🌐" },
  { key: "stocks",      label: "주식지수",   emoji: "📈" },
  { key: "commodities", label: "원자재",     emoji: "🏅" },
  { key: "forex",       label: "통화",       emoji: "💱" },
  { key: "crypto",      label: "암호화폐",   emoji: "₿" },
];

// ── 심볼 데이터 ──────────────────────────────────────────────────────────────
const STOCKS = [
  { symbol: "TVC:US30",       label: "다우존스",        sub: "Dow Jones Industrial" },
  { symbol: "TVC:NAS100",     label: "나스닥 100",      sub: "NASDAQ 100 Index" },
  { symbol: "TVC:SPX500",     label: "S&P 500",         sub: "S&P 500 Index" },
  { symbol: "CME_MINI:NQ1!",  label: "NQ 선물",         sub: "NASDAQ 100 Futures" },
  { symbol: "TVC:NKY",        label: "니케이 225",      sub: "Nikkei 225 Index" },
  { symbol: "TVC:HSI",        label: "항셍",            sub: "Hang Seng Index" },
  { symbol: "TVC:UK100",      label: "FTSE 100",        sub: "UK 100 Index" },
  { symbol: "TVC:DEU40",      label: "DAX",             sub: "DAX 40 Index" },
  { symbol: "TVC:FRA40",      label: "CAC 40",          sub: "France 40 Index" },
  { symbol: "KRX:KOSPI",      label: "코스피",          sub: "KOSPI Index" },
  { symbol: "KRX:KOSDAQ",     label: "코스닥",          sub: "KOSDAQ Index" },
  { symbol: "SSE:000001",     label: "상해 종합",       sub: "SSE Composite Index" },
];

const COMMODITIES = [
  { symbol: "TVC:GOLD",       label: "금 (Gold)",       sub: "Gold / USD Spot" },
  { symbol: "TVC:SILVER",     label: "은 (Silver)",     sub: "Silver / USD Spot" },
  { symbol: "TVC:USOIL",      label: "WTI 원유",        sub: "WTI Crude Oil" },
  { symbol: "TVC:UKOIL",      label: "브렌트 원유",     sub: "Brent Crude Oil" },
  { symbol: "TVC:COPPER",     label: "구리",            sub: "Copper CFDS" },
  { symbol: "TVC:NATGAS",     label: "천연가스",        sub: "Natural Gas Spot" },
];

const FOREX = [
  { symbol: "TVC:DXY",        label: "달러 인덱스",     sub: "US Dollar Index" },
  { symbol: "FX_IDC:USDKRW",  label: "USD / KRW",       sub: "달러 원화" },
  { symbol: "FX:USDJPY",      label: "USD / JPY",       sub: "달러 엔화" },
  { symbol: "FX:EURUSD",      label: "EUR / USD",       sub: "유로 달러" },
  { symbol: "FX:GBPUSD",      label: "GBP / USD",       sub: "파운드 달러" },
  { symbol: "FX:AUDUSD",      label: "AUD / USD",       sub: "호주달러" },
  { symbol: "FX:USDCNY",      label: "USD / CNY",       sub: "달러 위안" },
];

const CRYPTO = [
  { symbol: "BINANCE:BTCUSDT",  label: "비트코인",      sub: "BTC / USDT" },
  { symbol: "BINANCE:ETHUSDT",  label: "이더리움",      sub: "ETH / USDT" },
  { symbol: "BINANCE:XRPUSDT",  label: "리플",          sub: "XRP / USDT" },
  { symbol: "BINANCE:SOLUSDT",  label: "솔라나",        sub: "SOL / USDT" },
  { symbol: "BINANCE:BNBUSDT",  label: "바이낸스코인",  sub: "BNB / USDT" },
  { symbol: "BINANCE:ADAUSDT",  label: "에이다",        sub: "ADA / USDT" },
  { symbol: "BINANCE:DOGEUSDT", label: "도지코인",      sub: "DOGE / USDT" },
  { symbol: "BINANCE:AVAXUSDT", label: "아발란체",      sub: "AVAX / USDT" },
  { symbol: "BINANCE:DOTUSDT",  label: "폴카닷",        sub: "DOT / USDT" },
  { symbol: "BINANCE:LINKUSDT", label: "체인링크",      sub: "LINK / USDT" },
  { symbol: "BINANCE:SUIUSDT",  label: "수이",          sub: "SUI / USDT" },
  { symbol: "BINANCE:PEPEUSDT", label: "페페",          sub: "PEPE / USDT" },
];

function QuoteGrid({ items }: { items: { symbol: string; label: string; sub: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {items.map(({ symbol, label, sub }) => (
        <div key={symbol} className="space-y-1">
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-xs font-black text-white">{label}</span>
            <span className="text-[10px] text-neutral-600 truncate">{sub}</span>
          </div>
          <TradingViewSingleQuote symbol={symbol} />
        </div>
      ))}
    </div>
  );
}

export default function IndicatorsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("stocks");

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8">
      {/* 헤더 */}
      <div className="max-w-[1400px] mx-auto px-2.5 md:px-8 pt-4 md:pt-8 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl md:text-3xl font-black text-white tracking-tight">시장 지표</h1>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20 animate-pulse">LIVE</span>
        </div>
        <p className="text-neutral-500 text-xs md:text-sm">TradingView 실시간 글로벌 시장 데이터</p>
      </div>

      {/* 탭 바 */}
      <div className="sticky top-14 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-[1400px] mx-auto px-2.5 md:px-8">
          <div className="flex overflow-x-auto scrollbar-hide gap-0.5 py-1.5">
            {TABS.map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === key
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="max-w-[1400px] mx-auto px-2.5 md:px-8 py-4 md:py-6">

        {activeTab === "overview" && (
          <div className="space-y-4">
            <SectionHeader title="글로벌 시장 전체 흐름" desc="주요 지수, 원자재, 외환 실시간 요약" />
            <TradingViewMarketWidget />
          </div>
        )}

        {activeTab === "stocks" && (
          <div className="space-y-4">
            <SectionHeader title="주식 지수" desc="글로벌 주요 주가 지수 실시간 시세" />
            <QuoteGrid items={STOCKS} />
          </div>
        )}

        {activeTab === "commodities" && (
          <div className="space-y-4">
            <SectionHeader title="원자재" desc="금, 은, 원유, 구리 등 원자재 실시간 시세" />
            <QuoteGrid items={COMMODITIES} />
          </div>
        )}

        {activeTab === "forex" && (
          <div className="space-y-4">
            <SectionHeader title="통화 (Forex)" desc="달러인덱스, 원달러, 주요 환율 실시간 시세" />
            <QuoteGrid items={FOREX} />
          </div>
        )}

        {activeTab === "crypto" && (
          <div className="space-y-4">
            <SectionHeader title="암호화폐" desc="바이낸스 기준 주요 코인 실시간 시세" />
            <QuoteGrid items={CRYPTO} />
          </div>
        )}

      </div>
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border-b border-neutral-800 pb-3">
      <h2 className="text-base md:text-xl font-black text-white">{title}</h2>
      <p className="text-neutral-500 text-xs md:text-sm mt-0.5">{desc}</p>
    </div>
  );
}
