"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

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

function TradingViewTimeline({ market, refreshKey }: { market: NewsMarket; refreshKey: number }) {
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
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: "100%",
      colorTheme: "dark",
      locale: "kr",
    };

    if (market === "all") {
      config.feedMode = "all_symbols";
    } else {
      config.feedMode = "market";
      config.market = market;
    }

    script.textContent = JSON.stringify(config);
    el.appendChild(script);

    return () => { if (el) el.innerHTML = ""; };
  }, [market, refreshKey]);

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 3분마다 자동 새로고침 (위젯 재마운트)
  useEffect(() => {
    const id = setInterval(() => {
      setRefreshKey(k => k + 1);
      setLastRefresh(new Date());
    }, 180_000);
    return () => clearInterval(id);
  }, []);

  const handleManualRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    setLastRefresh(new Date());
  }, []);

  const timeSinceRefresh = () => {
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (diff < 60) return `${diff}초 전`;
    return `${Math.floor(diff / 60)}분 전`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8 flex flex-col">
      <div className="max-w-[1200px] mx-auto w-full px-3 md:px-8 pt-4 md:pt-8 pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">글로벌 뉴스</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 animate-pulse">LIVE</span>
            </div>
            <p className="text-neutral-500 text-xs">TradingView 실시간 마켓 뉴스 · Reuters · Hankyung · CoinNess</p>
          </div>
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:border-neutral-600 transition-all self-start md:self-auto"
          >
            <span className="text-base leading-none">↻</span>
            새로고침
            <span className="text-xs text-neutral-600 ml-1">{timeSinceRefresh()}</span>
          </button>
        </div>
      </div>

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

      <div className="flex-1 max-w-[1200px] mx-auto w-full px-3 md:px-8 py-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 600 }}>
          <TradingViewTimeline market={activeMarket} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
