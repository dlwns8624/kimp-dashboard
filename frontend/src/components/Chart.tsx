"use client";

import React, { useEffect, useRef, useState, memo } from 'react';

interface ChartProps {
  symbol: string;          // 표시용 심볼 (e.g. "BTC", "NASDAQ 100", "Gold")
  upbitSymbol?: string;
  tvSymbol?: string;       // 직접 TradingView 심볼 지정 (e.g. "NASDAQ:NDX")
  displayName?: string;    // 헤더 표시 이름 (지정 안 하면 symbol 사용)
  subName?: string;        // 헤더 서브 이름 (기본: "TradingView · Binance")
}

// 코인 심볼 → TradingView Binance 심볼 매핑
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
  ORDI: "BINANCE:ORDIUSDT", MINA: "BINANCE:MINAUSDT", ASTR: "BINANCE:ASTRUSDT",
  GLM: "BINANCE:GLMUSDT", MASK: "BINANCE:MASKUSDT",
  // 매크로 지수 / FX
  NDX:    "NASDAQ:NDX",
  NQ:     "CME_MINI:NQ1!",
  GOLD:   "TVC:GOLD",
  USDKRW: "FX:USDKRW",
};

function getTvSymbol(symbol: string, tvSymbolOverride?: string): string {
  if (tvSymbolOverride) return tvSymbolOverride;
  return COIN_MAP[symbol.toUpperCase()] ?? `BINANCE:${symbol.toUpperCase()}USDT`;
}

function Chart({ symbol, tvSymbol: tvSymbolProp, displayName, subName }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef    = useRef<unknown>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 반응형 크기 감지
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // TradingView 위젯 생성
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (widgetRef.current) { el.innerHTML = ""; widgetRef.current = null; }

    const tvSym   = getTvSymbol(symbol, tvSymbolProp);
    const mobile  = window.innerWidth < 768;

    const script  = document.createElement("script");
    script.src    = "https://s3.tradingview.com/tv.js";
    script.async  = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!el || !(window as any).TradingView) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TV = (window as any).TradingView;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      widgetRef.current = new TV.widget({
        symbol:           tvSym,
        interval:         mobile ? "60" : "15",
        timezone:         "Asia/Seoul",
        theme:            "dark",
        style:            "1",
        locale:           "kr",
        container_id:     el.id,
        autosize:         true,
        toolbar_bg:       "#0a0a0a",
        enable_publishing: false,

        // 모바일: 최대한 심플하게
        hide_top_toolbar:  mobile,
        hide_legend:       mobile,
        hide_side_toolbar: mobile,
        withdateranges:    !mobile,
        save_image:        false,
        hide_volume:       mobile,

        // 모바일에선 인디케이터 없이 (차트 영역 최대화)
        studies: mobile ? [] : ["STD;Bollinger_Bands", "STD;MACD"],

        overrides: {
          "mainSeriesProperties.candleStyle.upColor":        "#ef4444",
          "mainSeriesProperties.candleStyle.downColor":      "#3b82f6",
          "mainSeriesProperties.candleStyle.borderUpColor":  "#ef4444",
          "mainSeriesProperties.candleStyle.borderDownColor":"#3b82f6",
          "mainSeriesProperties.candleStyle.wickUpColor":    "#ef4444",
          "mainSeriesProperties.candleStyle.wickDownColor":  "#3b82f6",
          "paneProperties.background":     "#0a0a0a",
          "paneProperties.backgroundType": "solid",
        },
        loading_screen: { backgroundColor: "#0a0a0a", foregroundColor: "#6366f1" },
      });
    };

    document.head.appendChild(script);
    return () => { if (el) { el.innerHTML = ""; } widgetRef.current = null; };
  // isMobile 바뀔 때도 위젯 재생성
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tvSymbolProp, isMobile]);

  const containerId   = `tv-chart-${symbol}-${Date.now() % 10000}`;
  const chartHeight   = isMobile ? 260 : 450;
  const headerDisplay = displayName ?? symbol;
  const headerSub     = subName ?? "TradingView · Binance";

  return (
    <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl relative">
      {/* 헤더 */}
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
