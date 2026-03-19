"use client";

import React, { useEffect, useState } from 'react';

interface ChartProps {
  symbol: string;
  binanceSymbol: string;
}

export default function Chart({ symbol, binanceSymbol }: ChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-[500px] bg-neutral-900 animate-pulse rounded-2xl" />;

  const encodedSymbol = encodeURIComponent(`BINANCE:${binanceSymbol || (symbol + "USDT")}`);
  const iframeUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodedSymbol}&interval=60&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Asia%2FSeoul&withdateranges=1&showcast=0&hideideas=0&locale=kr`;

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
        <h3 className="text-white font-black flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          {symbol} 프리미엄 실시간 차트
        </h3>
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">TradingView PRO</span>
      </div>
      <div className="w-full h-[500px]">
        <iframe
          id="tradingview_chart"
          src={iframeUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
