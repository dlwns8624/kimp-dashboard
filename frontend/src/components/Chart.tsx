"use client";

import React, { useEffect, useRef } from 'react';

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

  useEffect(() => {
    const containerId = `tv_chart_${symbol.toLowerCase()}`;
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = `<div id="${containerId}" style="height: 500px; width: 100%;"></div>`;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          "width": "100%",
          "height": 500,
          "symbol": `BINANCE:${binanceSymbol}`,
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
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script if needed, but usually tv.js is loaded once
    };
  }, [symbol, binanceSymbol]);

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
        <h3 className="text-white font-black flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          {symbol} 실시간 차트 (바이낸스 기준)
        </h3>
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">TradingView Advanced Tool</span>
      </div>
      <div ref={containerRef} className="w-full h-[500px]" />
    </div>
  );
}
