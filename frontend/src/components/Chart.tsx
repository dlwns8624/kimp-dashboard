"use client";

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface ChartProps {
  symbol: string;
  binanceSymbol: string;
}

export default function Chart({ symbol, binanceSymbol }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const containerId = `tv_chart_${symbol.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
    if (!containerRef.current) return;

    containerRef.current.innerHTML = `<div id="${containerId}" style="height: 500px; width: 100%;"></div>`;

    let scriptLoaded = false;
    const initWidget = () => {
      if (window.TradingView && document.getElementById(containerId)) {
        try {
          new window.TradingView.widget({
            "width": "100%",
            "height": 500,
            "symbol": `BINANCE:${binanceSymbol || (symbol + "USDT")}`,
            "interval": "60",
            "timezone": "Asia/Seoul",
            "theme": "dark",
            "style": "1",
            "locale": "kr",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "container_id": containerId,
          });
        } catch (e) {
          console.error("TradingView widget init failed:", e);
          setLoadError(true);
        }
      } else if (!scriptLoaded) {
          // Retry logic if TradingView object is not ready yet
          setTimeout(initWidget, 500);
      }
    };

    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.id = 'tradingview-sdk';
      script.onload = () => {
        scriptLoaded = true;
        initWidget();
      };
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    } else {
      scriptLoaded = true;
      initWidget();
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol, binanceSymbol]);

  if (loadError) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-neutral-900 border border-red-500/20 rounded-2xl">
        <p className="text-red-400 font-bold">차트를 불러오는 중 오류가 발생했습니다. (TradingView SDK)</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
        <h3 className="text-white font-black flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          {symbol} 프리미엄 실시간 차트
        </h3>
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">TradingView PRO</span>
      </div>
      <div ref={containerRef} className="w-full h-[500px]" />
    </div>
  );
}
