"use client";

import { useEffect, useRef } from "react";

type Props = {
  symbol: string;   // e.g. "NASDAQ:NDX", "TVC:GOLD", "FX:USDKRW"
  height?: number;
};

export default function TradingViewMacroWidget({ symbol, height = 240 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const script = document.createElement("script");
    script.type  = "text/javascript";
    script.async = true;
    script.src   = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.textContent = JSON.stringify({
      symbol,
      width:        "100%",
      height,
      locale:       "en",
      dateRange:    "3M",
      colorTheme:   "dark",
      isTransparent: true,
      autosize:     false,
      largeChartUrl: "",
    });
    el.appendChild(script);

    return () => { if (el) el.innerHTML = ""; };
  }, [symbol, height]);

  return (
    <div ref={containerRef} className="tradingview-widget-container" style={{ height }} />
  );
}
