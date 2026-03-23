"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, Coins, CircleDollarSign, Bitcoin } from "lucide-react";

const TradingViewSingleQuote = dynamic(() => import("@/components/TradingViewSingleQuote"), { ssr: false });

// ── 탭 정의 ─────────────────────────────────────────────────────────────────
type TabKey = "stocks" | "commodities" | "forex" | "crypto";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "stocks",      label: "주식지수",   icon: <TrendingUp className="w-4 h-4" /> },
  { key: "commodities", label: "원자재",     icon: <Coins className="w-4 h-4" /> },
  { key: "forex",       label: "통화",       icon: <CircleDollarSign className="w-4 h-4" /> },
  { key: "crypto",      label: "암호화폐",   icon: <Bitcoin className="w-4 h-4" /> },
];

const STOCKS = [
  { symbol: "TVC:US30",    label: "다우존스",   sub: "Dow Jones Industrial" },
  { symbol: "TVC:NAS100",  label: "나스닥 100", sub: "NASDAQ 100 Index" },
  { symbol: "TVC:SPX500",  label: "S&P 500",    sub: "S&P 500 Index" },
  { symbol: "TVC:NKY",     label: "니케이 225", sub: "Nikkei 225 Index" },
  { symbol: "SSE:000001",  label: "상해 종합",  sub: "SSE Composite Index" },
  { symbol: "TVC:HSI",     label: "항셍",       sub: "Hang Seng Index" },
  { symbol: "TVC:UK100",   label: "FTSE 100",   sub: "UK 100 Index" },
  { symbol: "TVC:FRA40",   label: "CAC 40",     sub: "France 40 Index" },
  { symbol: "TVC:DEU40",   label: "DAX",        sub: "DAX 40 Index" },
];

const COMMODITIES = [
  { symbol: "TVC:GOLD",    label: "금 (Gold)",    sub: "Gold / USD Spot" },
  { symbol: "TVC:SILVER",  label: "은 (Silver)",  sub: "Silver / USD Spot" },
  { symbol: "TVC:COPPER",  label: "구리",          sub: "Copper CFDS" },
  { symbol: "TVC:USOIL",   label: "WTI 원유",     sub: "WTI Crude Oil" },
  { symbol: "TVC:UKOIL",   label: "브렌트 원유",  sub: "Brent Crude Oil" },
  { symbol: "TVC:NATGAS",  label: "천연가스",      sub: "Natural Gas Spot" },
];

const FOREX = [
  { symbol: "TVC:DXY",        label: "달러 인덱스",  sub: "US Dollar Index" },
  { symbol: "FX_IDC:USDKRW",  label: "USD / KRW",    sub: "달러 원화" },
  { symbol: "FX:USDJPY",      label: "USD / JPY",    sub: "달러 엔화" },
  { symbol: "FX:EURUSD",      label: "EUR / USD",    sub: "유로 달러" },
  { symbol: "FX:GBPUSD",      label: "GBP / USD",    sub: "파운드 달러" },
  { symbol: "FX:AUDUSD",      label: "AUD / USD",    sub: "호주달러" },
  { symbol: "FX:USDCNY",      label: "USD / CNY",    sub: "달러 위안" },
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {items.map(({ symbol, label, sub }) => (
        <div key={symbol} className="flex flex-col space-y-3 p-4 bg-neutral-900/40 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition-colors">
          <div className="flex flex-col gap-0.5 px-1 tracking-tight">
            <span className="text-sm font-semibold text-neutral-100">{label}</span>
            <span className="text-xs text-neutral-500 truncate">{sub}</span>
          </div>
          <div className="flex-1 min-h-[50px] rounded-xl overflow-hidden bg-neutral-950/50 shadow-inner">
            <TradingViewSingleQuote symbol={symbol} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IndicatorsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("stocks");

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-12 text-neutral-300">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">시장 지표</h1>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold border border-emerald-500/20 uppercase tracking-widest">LIVE</span>
        </div>
        <p className="text-neutral-500 text-sm">TradingView 실시간 글로벌 시장 데이터</p>
      </div>

      <div className="sticky top-14 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/60">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex overflow-x-auto scrollbar-hide gap-2 py-3">
            {TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === key
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 shadow-sm"
                    : "text-neutral-400 border border-transparent hover:text-neutral-200 hover:bg-neutral-800/60"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8">
        {activeTab === "stocks" && (
          <div className="space-y-6">
            <SectionHeader title="주식 지수" desc="글로벌 주요 주가 지수 실시간 시세" />
            <QuoteGrid items={STOCKS} />
          </div>
        )}

        {activeTab === "commodities" && (
          <div className="space-y-6">
            <SectionHeader title="원자재" desc="금, 은, 원유, 구리 등 원자재 실시간 시세" />
            <QuoteGrid items={COMMODITIES} />
          </div>
        )}

        {activeTab === "forex" && (
          <div className="space-y-6">
            <SectionHeader title="통화 (Forex)" desc="달러인덱스, 원달러, 주요 환율 실시간 시세" />
            <QuoteGrid items={FOREX} />
          </div>
        )}

        {activeTab === "crypto" && (
          <div className="space-y-6">
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
    <div className="pb-2">
      <h2 className="text-lg md:text-xl font-bold text-neutral-100 tracking-tight mb-1.5">{title}</h2>
      <p className="text-neutral-400 text-sm">{desc}</p>
    </div>
  );
}
