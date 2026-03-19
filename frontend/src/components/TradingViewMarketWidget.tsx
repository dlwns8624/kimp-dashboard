"use client";

import React, { useEffect, useRef } from 'react';

export default function TradingViewMarketWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": 800,
      "symbolsGroups": [
        {
          "name": "주요 지수 (Indices)",
          "originalName": "Indices",
          "symbols": [
            { "name": "FOREXCOM:SPXUSD", "displayName": "S&P 500" },
            { "name": "FOREXCOM:NSXUSD", "displayName": "Nasdaq 100" },
            { "name": "TVC:NI225", "displayName": "Nikkei 225" },
            { "name": "KRX:KOSPI", "displayName": "KOSPI" },
            { "name": "KRX:KOSDAQ", "displayName": "KOSDAQ" },
            { "name": "FX_IDC:HKG33", "displayName": "Hang Seng" }
          ]
        },
        {
          "name": "원자재 (Commodities)",
          "originalName": "Commodities",
          "symbols": [
            { "name": "TVC:GOLD", "displayName": "Gold" },
            { "name": "TVC:SILVER", "displayName": "Silver" },
            { "name": "TVC:USOIL", "displayName": "WTI Crude Oil" },
            { "name": "TVC:UKOIL", "displayName": "Brent Oil" },
            { "name": "TVC:NG1!", "displayName": "Natural Gas" }
          ]
        },
        {
          "name": "외환 (Forex)",
          "originalName": "Forex",
          "symbols": [
            { "name": "FX_IDC:USDKRW", "displayName": "USD/KRW" },
            { "name": "TVC:DXY", "displayName": "US Dollar Index" },
            { "name": "FX:EURUSD", "displayName": "EUR/USD" },
            { "name": "FX:USDJPY", "displayName": "USD/JPY" },
            { "name": "FX:GBPUSD", "displayName": "GBP/USD" }
          ]
        }
      ],
      "showSymbolLogo": true,
      "isTransparent": true,
      "colorTheme": "dark",
      "locale": "ko"
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}
