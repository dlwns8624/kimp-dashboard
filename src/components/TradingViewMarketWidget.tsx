"use client";

import React, { useEffect, useState } from 'react';

export default function TradingViewMarketWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[800px] w-full bg-neutral-900 animate-pulse rounded-2xl" />;

  const options = {
    width: "100%",
    height: 800,
    symbolsGroups: [
      {
        name: "주요 지수 (Indices)",
        originalName: "Indices",
        symbols: [
          { name: "FOREXCOM:SPXUSD", displayName: "S&P 500" },
          { name: "FOREXCOM:NSXUSD", displayName: "Nasdaq 100" },
          { name: "TVC:NI225", displayName: "Nikkei 225" },
          { name: "KRX:KOSPI", displayName: "KOSPI" },
          { name: "KRX:KOSDAQ", displayName: "KOSDAQ" },
          { name: "FX_IDC:HKG33", displayName: "Hang Seng" }
        ]
      },
      {
        name: "원자재 (Commodities)",
        originalName: "Commodities",
        symbols: [
          { name: "TVC:GOLD", displayName: "Gold" },
          { name: "TVC:SILVER", displayName: "Silver" },
          { name: "TVC:USOIL", displayName: "WTI Crude Oil" },
          { name: "TVC:UKOIL", displayName: "Brent Oil" },
          { name: "TVC:NG1!", displayName: "Natural Gas" }
        ]
      },
      {
        name: "외환 (Forex)",
        originalName: "Forex",
        symbols: [
          { name: "FX_IDC:USDKRW", displayName: "USD/KRW" },
          { name: "TVC:DXY", displayName: "US Dollar Index" },
          { name: "FX:EURUSD", displayName: "EUR/USD" },
          { name: "FX:USDJPY", displayName: "USD/JPY" },
          { name: "FX:GBPUSD", displayName: "GBP/USD" }
        ]
      }
    ],
    showSymbolLogo: true,
    colorTheme: "dark",
    isTransparent: true,
    locale: "ko"
  };

  const iframeUrl = `https://www.tradingview-widget.com/embed-widget-market-quotes/?locale=ko#${encodeURIComponent(JSON.stringify(options))}`;

  return (
    <div className="w-full h-[800px] bg-neutral-900/50 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
      <iframe
        src={iframeUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="TradingView Market Quotes"
      ></iframe>
    </div>
  );
}
