"use client";

import React, { useEffect, useRef, useState } from "react";

type CalendarView = "investing" | "tradingview";

function InvestingCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.src =
      "https://sslecal2.investing.com/?" +
      "columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous" +
      "&importance=2,3" +
      "&features=datepicker,timezone,times498,filters" +
      "&countries=25,32,6,37,72,22,17,39,14,10,35,43,56,36,110,11,26,12,4,5" +
      "&calType=week" +
      "&timeZone=88" +
      "&lang=18";
    iframe.width = "100%";
    iframe.style.border = "none";
    iframe.style.height = "100%";
    iframe.style.minHeight = "600px";
    iframe.style.colorScheme = "dark";
    iframe.allowFullscreen = true;

    el.appendChild(iframe);
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
  );
}

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
  const [view, setView] = useState<CalendarView>("investing");

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8 flex flex-col">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto w-full px-3 md:px-8 pt-4 md:pt-8 pb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">글로벌 경제 캘린더</h1>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20 animate-pulse">LIVE</span>
        </div>
        <p className="text-neutral-500 text-xs">암호화폐 변동성에 영향을 미치는 주요 거시경제 지표 발표 일정</p>
      </div>

      {/* Source Toggle */}
      <div className="sticky top-14 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-[1400px] mx-auto px-3 md:px-8 py-2 flex items-center gap-2">
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setView("investing")}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${view === "investing" ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              Investing.com
            </button>
            <button
              onClick={() => setView("tradingview")}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${view === "tradingview" ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              TradingView
            </button>
          </div>
          <span className="text-[10px] text-neutral-600 font-bold">
            {view === "investing" ? "Investing.com 실시간 경제 캘린더" : "TradingView 경제 이벤트"}
          </span>
        </div>
      </div>

      {/* Calendar Widget */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-3 md:px-8 py-4">
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
          style={{ height: "calc(100vh - 200px)", minHeight: 600 }}
        >
          {view === "investing" ? <InvestingCalendar /> : <TradingViewCalendar />}
        </div>
      </div>
    </div>
  );
}
