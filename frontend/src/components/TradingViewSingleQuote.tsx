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
    <div className="w-full bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800 shadow-lg h-[80px] md:h-[126px]">
      {/* 모바일: scale-[0.63]로 축소 → width를 역수(159%)로 보정해 가로가 잘리지 않게 */}
      <div
        className="origin-top-left scale-[0.63] md:scale-100 w-[159%] md:w-full"
        style={{ height: 126 }}
      >
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ width: "100%", height: 126 }}
        />
      </div>
    </div>
  );
}

export default memo(TradingViewSingleQuote);
