"use client";

import React from "react";
import dynamic from "next/dynamic";

const MarketWidget = dynamic(() => import("@/components/TradingViewMarketWidget"), { 
  ssr: false,
  loading: () => <div className="h-[800px] w-full bg-neutral-900 animate-pulse rounded-2xl flex items-center justify-center text-neutral-500 font-bold uppercase tracking-widest text-xs">Loading TradingView Indicators...</div>
});

export default function IndicatorsPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-8">
      <div className="border-b border-neutral-800 pb-8 space-y-2">
         <h1 className="text-3xl font-black text-white tracking-tight">시장 지표 (Market Indicators)</h1>
         <p className="text-neutral-500 text-sm">TradingView 실시간 시세 위젯</p>
      </div>
      <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-2xl overflow-hidden">
        <MarketWidget />
      </div>
    </div>
  );
}
