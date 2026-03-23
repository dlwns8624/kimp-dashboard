"use client";

import React, { useEffect, useRef } from "react";

function TradingViewCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.textContent = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "kr",
      importanceFilter: "-1,0,1",
      countryFilter: "us,eu,gb,jp,cn,kr,de,fr,au,ca",
    });
    el.appendChild(script);

    return () => { if (el) el.innerHTML = ""; };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8 flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full px-3 md:px-8 pt-4 md:pt-8 pb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">글로벌 경제 캘린더</h1>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 animate-pulse">LIVE</span>
        </div>
        <p className="text-neutral-500 text-xs">암호화폐 변동성에 영향을 미치는 주요 거시경제 지표 발표 일정 · TradingView</p>
      </div>

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-3 md:px-8 py-4">
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
          style={{ height: "calc(100vh - 180px)", minHeight: 600 }}
        >
          <TradingViewCalendar />
        </div>
      </div>
    </div>
  );
}
