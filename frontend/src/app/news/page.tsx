"use client";

import React, { useState, useEffect, useRef } from "react";

type NewsMarket = "all" | "stock" | "crypto" | "forex" | "index" | "futures" | "bond" | "economic";

const MARKET_TABS: { key: NewsMarket; label: string }[] = [
  { key: "all",      label: "전체" },
  { key: "stock",    label: "주식" },
  { key: "crypto",   label: "크립토" },
  { key: "forex",    label: "외환" },
  { key: "index",    label: "지수" },
  { key: "futures",  label: "선물" },
  { key: "bond",     label: "국채" },
  { key: "economic", label: "경제" },
];

function TradingViewTimeline({ market }: { market: NewsMarket }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";

    const config: Record<string, unknown> = {
      feedMode: "market",
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: "100%",
      colorTheme: "dark",
      locale: "kr",
    };

    if (market === "all") {
      config.feedMode = "all_symbols";
    } else if (market === "stock") {
      config.feedMode = "market";
      config.market = "stock";
    } else if (market === "crypto") {
      config.feedMode = "market";
      config.market = "crypto";
    } else if (market === "forex") {
      config.feedMode = "market";
      config.market = "forex";
    } else if (market === "index") {
      config.feedMode = "market";
      config.market = "index";
    } else if (market === "futures") {
      config.feedMode = "market";
      config.market = "futures";
    } else if (market === "bond") {
      config.feedMode = "market";
      config.market = "bond";
    } else if (market === "economic") {
      config.feedMode = "market";
      config.market = "economic";
    }

    script.textContent = JSON.stringify(config);
    el.appendChild(script);

    return () => { if (el) el.innerHTML = ""; };
  }, [market]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export default function NewsPage() {
  const [activeMarket, setActiveMarket] = useState<NewsMarket>("all");

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8 flex flex-col">
      {/* Header */}
      <div className="max-w-[1200px] mx-auto w-full px-3 md:px-8 pt-4 md:pt-8 pb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">글로벌 뉴스</h1>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20 animate-pulse">LIVE</span>
        </div>
        <p className="text-neutral-500 text-xs">TradingView 실시간 마켓 뉴스 · Reuters · Hankyung · CoinNess</p>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-14 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-[1200px] mx-auto px-3 md:px-8">
          <div className="flex overflow-x-auto scrollbar-hide gap-0.5 py-1.5">
            {MARKET_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveMarket(key)}
                className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeMarket === key
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TradingView Timeline Widget */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-3 md:px-8 py-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 600 }}>
          <TradingViewTimeline market={activeMarket} />
        </div>
      </div>
    </div>
  );
}
