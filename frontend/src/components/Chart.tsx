"use client";

import React, { useEffect, useRef, memo } from 'react';

interface ChartProps {
  symbol: string;
  upbitSymbol?: string;
}

// Map our symbol names to TradingView-compatible Binance symbols
function getTradingViewSymbol(symbol: string): string {
  const symbolMap: Record<string, string> = {
    BTC: "BINANCE:BTCUSDT",
    ETH: "BINANCE:ETHUSDT",
    XRP: "BINANCE:XRPUSDT",
    SOL: "BINANCE:SOLUSDT",
    DOGE: "BINANCE:DOGEUSDT",
    ADA: "BINANCE:ADAUSDT",
    AVAX: "BINANCE:AVAXUSDT",
    LINK: "BINANCE:LINKUSDT",
    DOT: "BINANCE:DOTUSDT",
    MATIC: "BINANCE:MATICUSDT",
    SHIB: "BINANCE:SHIBUSDT",
    TRX: "BINANCE:TRXUSDT",
    UNI: "BINANCE:UNIUSDT",
    ATOM: "BINANCE:ATOMUSDT",
    ETC: "BINANCE:ETCUSDT",
    NEAR: "BINANCE:NEARUSDT",
    AAVE: "BINANCE:AAVEUSDT",
    APT: "BINANCE:APTUSDT",
    ARB: "BINANCE:ARBUSDT",
    OP: "BINANCE:OPUSDT",
    SUI: "BINANCE:SUIUSDT",
    SEI: "BINANCE:SEIUSDT",
    STX: "BINANCE:STXUSDT",
    IMX: "BINANCE:IMXUSDT",
    SAND: "BINANCE:SANDUSDT",
    MANA: "BINANCE:MANAUSDT",
    AXS: "BINANCE:AXSUSDT",
    HBAR: "BINANCE:HBARUSDT",
    FTM: "BINANCE:FTMUSDT",
    ALGO: "BINANCE:ALGOUSDT",
    FLOW: "BINANCE:FLOWUSDT",
    ICP: "BINANCE:ICPUSDT",
    VET: "BINANCE:VETUSDT",
    THETA: "BINANCE:THETAUSDT",
    GRT: "BINANCE:GRTUSDT",
    FIL: "BINANCE:FILUSDT",
    EOS: "BINANCE:EOSUSDT",
    XLM: "BINANCE:XLMUSDT",
    IOTA: "BINANCE:IOTAUSDT",
    NEO: "BINANCE:NEOUSDT",
    KAVA: "BINANCE:KAVAUSDT",
    ZIL: "BINANCE:ZILUSDT",
    ENJ: "BINANCE:ENJUSDT",
    CHZ: "BINANCE:CHZUSDT",
    BAT: "BINANCE:BATUSDT",
    QTUM: "BINANCE:QTUMUSDT",
    ONT: "BINANCE:ONTUSDT",
    ZRX: "BINANCE:ZRXUSDT",
    WAVES: "BINANCE:WAVESUSDT",
    CRV: "BINANCE:CRVUSDT",
    SUSHI: "BINANCE:SUSHIUSDT",
    COMP: "BINANCE:COMPUSDT",
    YFI: "BINANCE:YFIUSDT",
    MKR: "BINANCE:MKRUSDT",
    SNX: "BINANCE:SNXUSDT",
    ANKR: "BINANCE:ANKRUSDT",
    SXP: "BINANCE:SXPUSDT",
    KNC: "BINANCE:KNCUSDT",
    STORJ: "BINANCE:STORJUSDT",
    CELO: "BINANCE:CELOUSDT",
    GMT: "BINANCE:GMTUSDT",
    LDO: "BINANCE:LDOUSDT",
    BLUR: "BINANCE:BLURUSDT",
    PEPE: "BINANCE:PEPEUSDT",
    WLD: "BINANCE:WLDUSDT",
    TIA: "BINANCE:TIAUSDT",
    JUP: "BINANCE:JUPUSDT",
  };
  return symbolMap[symbol.toUpperCase()] || `BINANCE:${symbol.toUpperCase()}USDT`;
}

function Chart({ symbol }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous widget
    if (widgetRef.current) {
      containerRef.current.innerHTML = '';
      widgetRef.current = null;
    }

    const tvSymbol = getTradingViewSymbol(symbol);

    // Load TradingView tv.js script (same as kimpga.com)
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (!containerRef.current || !(window as any).TradingView) return;

      widgetRef.current = new (window as any).TradingView.widget({
        // Core settings (same approach as kimpga.com)
        symbol: tvSymbol,
        interval: "15",
        timezone: "Asia/Seoul",
        theme: "dark",
        style: "1", // Candlestick
        locale: "kr",

        // Container
        container_id: containerRef.current.id,
        autosize: true,

        // UI settings
        toolbar_bg: "#0a0a0a",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        hide_volume: false,

        // Features to enable/disable
        allow_symbol_change: true,
        withdateranges: true,

        // Studies (indicators)
        studies: ["STD;Bollinger_Bands", "STD;MACD"],

        // Styling overrides
        overrides: {
          "mainSeriesProperties.candleStyle.upColor": "#ef4444",
          "mainSeriesProperties.candleStyle.downColor": "#3b82f6",
          "mainSeriesProperties.candleStyle.borderUpColor": "#ef4444",
          "mainSeriesProperties.candleStyle.borderDownColor": "#3b82f6",
          "mainSeriesProperties.candleStyle.wickUpColor": "#ef4444",
          "mainSeriesProperties.candleStyle.wickDownColor": "#3b82f6",
          "paneProperties.background": "#0a0a0a",
          "paneProperties.backgroundType": "solid",
        },

        // Loading completed callback
        loading_screen: {
          backgroundColor: "#0a0a0a",
          foregroundColor: "#6366f1",
        },
      });
    };

    document.head.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      widgetRef.current = null;
      // Note: We don't remove the script tag as it may be reused
    };
  }, [symbol]);

  const containerId = `tv-chart-${symbol}`;

  return (
    <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs ring-1 ring-indigo-500/20">
            {symbol.charAt(0)}
          </div>
          <div>
            <h3 className="text-white font-black text-sm leading-none mb-0.5">{symbol}/USDT</h3>
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none">TradingView · Binance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-md bg-neutral-800 text-[9px] font-bold text-neutral-400 border border-neutral-700">LIVE</div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>

      <div id={containerId} ref={containerRef} className="w-full" style={{ height: '450px' }} />
    </div>
  );
}

export default memo(Chart);
