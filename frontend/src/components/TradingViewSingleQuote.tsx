"use client";

import React, { useEffect, useRef, memo } from "react";

function TradingViewSingleQuote({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.textContent = JSON.stringify({
      symbol,
      width: "100%",
      isTransparent: true,
      colorTheme: "dark",
      locale: "ko",
    });

    el.appendChild(script);

    return () => {
      if (el) el.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div className="w-full bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ width: "100%", height: 126 }}
      />
    </div>
  );
}

export default memo(TradingViewSingleQuote);
