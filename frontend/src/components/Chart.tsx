"use client";

import React, { useEffect, useRef, useState, memo } from 'react';

interface ChartProps {
  symbol: string;
  upbitSymbol?: string;
  tvSymbol?: string;       // 직접 TradingView 심볼 지정
  displayName?: string;    // 헤더 표시 이름
  subName?: string;        // 헤더 서브 이름
}

const COIN_MAP: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT", ETH: "BINANCE:ETHUSDT", XRP: "BINANCE:XRPUSDT",
  SOL: "BINANCE:SOLUSDT", DOGE: "BINANCE:DOGEUSDT", ADA: "BINANCE:ADAUSDT",
  AVAX: "BINANCE:AVAXUSDT", LINK: "BINANCE:LINKUSDT", DOT: "BINANCE:DOTUSDT",
  MATIC: "BINANCE:MATICUSDT", SHIB: "BINANCE:SHIBUSDT", TRX: "BINANCE:TRXUSDT",
  UNI: "BINANCE:UNIUSDT", ATOM: "BINANCE:ATOMUSDT", ETC: "BINANCE:ETCUSDT",
  NEAR: "BINANCE:NEARUSDT", AAVE: "BINANCE:AAVEUSDT", APT: "BINANCE:APTUSDT",
  ARB: "BINANCE:ARBUSDT", OP: "BINANCE:OPUSDT", SUI: "BINANCE:SUIUSDT",
  SEI: "BINANCE:SEIUSDT", STX: "BINANCE:STXUSDT", IMX: "BINANCE:IMXUSDT",
  SAND: "BINANCE:SANDUSDT", MANA: "BINANCE:MANAUSDT", HBAR: "BINANCE:HBARUSDT",
  ALGO: "BINANCE:ALGOUSDT", FLOW: "BINANCE:FLOWUSDT", ICP: "BINANCE:ICPUSDT",
  VET: "BINANCE:VETUSDT", THETA: "BINANCE:THETAUSDT", GRT: "BINANCE:GRTUSDT",
  FIL: "BINANCE:FILUSDT", KAVA: "BINANCE:KAVAUSDT", ZIL: "BINANCE:ZILUSDT",
  ENJ: "BINANCE:ENJUSDT", CHZ: "BINANCE:CHZUSDT", BAT: "BINANCE:BATUSDT",
  QTUM: "BINANCE:QTUMUSDT", ZRX: "BINANCE:ZRXUSDT", CRV: "BINANCE:CRVUSDT",
  MKR: "BINANCE:MKRUSDT", SNX: "BINANCE:SNXUSDT", ANKR: "BINANCE:ANKRUSDT",
  BLUR: "BINANCE:BLURUSDT", PEPE: "BINANCE:PEPEUSDT", WLD: "BINANCE:WLDUSDT",
  TIA: "BINANCE:TIAUSDT", JUP: "BINANCE:JUPUSDT", BONK: "BINANCE:BONKUSDT",
  ORDI: "BINANCE:ORDIUSDT",
  // 매크로
  NDX:    "CME_MINI:NQ1!",   // 나스닥 100 선물
  NQ:     "CME_MINI:NQ1!",
  GOLD:   "TVC:GOLD",
  USDKRW: "FX:USDKRW",
};

function getTvSymbol(symbol: string, override?: string): string {
  if (override) return override;
  return COIN_MAP[symbol.toUpperCase()] ?? `BINANCE:${symbol.toUpperCase()}USDT`;
}

function Chart({ symbol, tvSymbol: tvSymbolProp, displayName, subName }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetRef    = useRef<any>(null);
  const [chartHeight, setChartHeight] = useState(450);

  // 높이만 반응형 (PC와 동일한 기능 유지)
  useEffect(() => {
    const update = () => setChartHeight(window.innerWidth < 768 ? 320 : 450);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (widgetRef.current) { el.innerHTML = ""; widgetRef.current = null; }

    const tvSym = getTvSymbol(symbol, tvSymbolProp);

    const script  = document.createElement("script");
    script.src    = "https://s3.tradingview.com/tv.js";
    script.async  = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!el || !(window as any).TradingView) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TV = (window as any).TradingView;
      widgetRef.current = new TV.widget({
        symbol:            tvSym,
        interval:          "15",
        timezone:          "Asia/Seoul",
        theme:             "dark",
        style:             "1",
        locale:            "kr",
        container_id:      el.id,
        autosize:          true,
        toolbar_bg:        "#0a0a0a",
        enable_publishing: false,
        hide_top_toolbar:  false,
        hide_legend:       false,
        hide_side_toolbar: false,
        withdateranges:    true,
        save_image:        false,
        hide_volume:       false,
        allow_symbol_change: true,
        // PC와 동일 — 모바일도 동일하게 표시
        studies: ["STD;Bollinger_Bands", "STD;MACD"],
        overrides: {
          "mainSeriesProperties.candleStyle.upColor":         "#ef4444",
          "mainSeriesProperties.candleStyle.downColor":       "#3b82f6",
          "mainSeriesProperties.candleStyle.borderUpColor":   "#ef4444",
          "mainSeriesProperties.candleStyle.borderDownColor": "#3b82f6",
          "mainSeriesProperties.candleStyle.wickUpColor":     "#ef4444",
          "mainSeriesProperties.candleStyle.wickDownColor":   "#3b82f6",
          "paneProperties.background":     "#0a0a0a",
          "paneProperties.backgroundType": "solid",
        },
        loading_screen: { backgroundColor: "#0a0a0a", foregroundColor: "#6366f1" },
      });
    };

    document.head.appendChild(script);
    return () => { if (el) el.innerHTML = ""; widgetRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tvSymbolProp, chartHeight]);

  const containerId   = `tv-chart-${symbol}-${Math.random().toString(36).slice(2, 7)}`;
  const headerDisplay = displayName ?? symbol;
  const headerSub     = subName ?? "TradingView · Binance";

  return (
    <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="px-3 py-2 md:p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 md:w-7 md:h-7 rounded-md md:rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-[9px] md:text-xs ring-1 ring-indigo-500/20">
            {headerDisplay.charAt(0)}
          </div>
          <div>
            <h3 className="text-white font-black text-xs md:text-sm leading-none mb-0.5">{headerDisplay}</h3>
            <p className="text-[8px] md:text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none">{headerSub}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="px-1.5 md:px-2 py-0.5 rounded-md bg-neutral-800 text-[8px] md:text-[9px] font-bold text-neutral-400 border border-neutral-700">LIVE</div>
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
      <div id={containerId} ref={containerRef} className="w-full" style={{ height: chartHeight }} />
    </div>
  );
}

export default memo(Chart);
