"use client";

import React, { useEffect, useState } from 'react';

export default function TradingViewSingleQuote({ symbol }: { symbol: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-[120px] bg-neutral-900 animate-pulse rounded-xl" />;

  const options = {
    symbol: symbol,
    width: "100%",
    colorTheme: "dark",
    isTransparent: true,
    locale: "ko"
  };

  const iframeUrl = `https://www.tradingview-widget.com/embed-widget-single-quote/?locale=ko#${encodeURIComponent(JSON.stringify(options))}`;

  return (
    <div className="w-full h-[126px] bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
      <iframe
        src={iframeUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={`TradingView Quote - ${symbol}`}
      ></iframe>
    </div>
  );
}
