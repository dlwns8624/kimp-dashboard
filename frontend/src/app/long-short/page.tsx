"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/lib/constants";

const Chart = dynamic(() => import("@/components/LongShortChart"), { ssr: false });

export default function LongShortPage() {
  const [asset, setAsset] = useState("BTC");
  const [timeframe, setTimeframe] = useState("1h");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/long-short-stats?symbol=${asset}USDT&period=${timeframe}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.global && data.top) setStats(data);
      })
      .catch(() => { });
  }, [asset, timeframe]);

  const getSafeRatio = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 50 : num * 100;
  };

  const cards = [
    { label: "전체 글로벌 롱/숏 (Binance General)", long: stats?.global ? getSafeRatio(stats.global.longAccount) : 50, short: stats?.global ? getSafeRatio(stats.global.shortAccount) : 50 },
    { label: "바이낸스 탑 트레이더 (Binance Top)", long: stats?.top ? getSafeRatio(stats.top.longAccount) : 53.2, short: stats?.top ? getSafeRatio(stats.top.shortAccount) : 46.8 },
    { label: "바이비트 추정 (Bybit Mock)", long: 49.12, short: 50.88 },
    { label: "OKX 추정 (OKX Mock)", long: 55.40, short: 44.60 },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{asset} 롱/숏 비율 분석</h1>
          <p className="text-neutral-400 text-sm mt-1">탑 포지션 및 전체 트레이더의 실시간 포지션(Long vs Short) 비율 데이터를 분석합니다.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={asset}
            onChange={e => setAsset(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white text-sm px-4 py-2 rounded-lg outline-none cursor-pointer"
          >
            <option value="BTC">BTC (Bitcoin)</option>
            <option value="ETH">ETH (Ethereum)</option>
            <option value="XRP">XRP (Ripple)</option>
            <option value="SOL">SOL (Solana)</option>
            <option value="DOGE">DOGE (Dogecoin)</option>
          </select>

          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white text-sm px-4 py-2 rounded-lg outline-none cursor-pointer"
          >
            <option value="15m">15분</option>
            <option value="1h">1시간</option>
            <option value="4h">4시간</option>
            <option value="1d">1일</option>
          </select>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item, idx) => (
          <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
            <h3 className="text-xs text-neutral-500 font-semibold mb-3">{item.label}</h3>
            <div>
              <div className="flex justify-between text-2xl font-bold mb-2">
                <span className="text-emerald-400">{item.long.toFixed(2)}%</span>
                <span className="text-rose-400">{item.short.toFixed(2)}%</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full flex overflow-hidden">
                <div className="bg-emerald-500" style={{ width: `${item.long}%` }}></div>
                <div className="bg-rose-500" style={{ width: `${item.short}%` }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                <span>Long</span>
                <span>Short</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Large Chart Placeholder */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 min-h-[500px]">
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6">Long/Short Ratio Trend ({timeframe})</h2>
        <Chart symbol={asset} timeframe={timeframe} />
      </div>
    </div>
  );
}
