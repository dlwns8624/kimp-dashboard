"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/lib/constants";

const LongShortChartDynamic = dynamic(() => import("@/components/LongShortChart"), { ssr: false });

type TraderType = "top" | "global";

interface LongShortStats {
  global: { longAccount: string; shortAccount: string };
  top: { longAccount: string; shortAccount: string };
}

const ASSETS = [
  { symbol: "BTC", label: "BTC" },
  { symbol: "ETH", label: "ETH" },
  { symbol: "XRP", label: "XRP" },
  { symbol: "SOL", label: "SOL" },
  { symbol: "DOGE", label: "DOGE" },
];

const TIMEFRAMES = [
  { value: "5m", label: "5분" },
  { value: "15m", label: "15분" },
  { value: "1h", label: "1시간" },
  { value: "4h", label: "4시간" },
  { value: "1d", label: "1일" },
];

const CHART_TYPES = [
  { value: "line", label: "라인" },
  { value: "area", label: "영역" },
];

const getRatio = (val: string | undefined) => {
  const n = parseFloat(val ?? "0.5");
  return isNaN(n) ? 50 : n * 100;
};

function LongShortGauge({ longPct, label }: { longPct: number; label: string }) {
  const shortPct = 100 - longPct;
  const isLongDominant = longPct > shortPct;

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{label}</p>

      {/* Large Numbers */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">Long</p>
          <p className="text-3xl md:text-4xl font-bold text-emerald-400 tracking-tight">{longPct.toFixed(2)}%</p>
        </div>
        <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${isLongDominant ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
          {isLongDominant ? "롱 우세" : "숏 우세"}
        </div>
        <div className="text-right">
          <p className="text-xs text-rose-500 font-bold uppercase tracking-wider mb-1">Short</p>
          <p className="text-3xl md:text-4xl font-bold text-rose-400 tracking-tight">{shortPct.toFixed(2)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full flex overflow-hidden bg-neutral-800">
        <div
          className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700 rounded-l-full"
          style={{ width: `${longPct}%` }}
        />
        <div
          className="bg-gradient-to-r from-rose-400 to-rose-600 flex-1 rounded-r-full"
        />
      </div>
    </div>
  );
}

export default function LongShortPage() {
  const [traderType, setTraderType] = useState<TraderType>("top");
  const [asset, setAsset] = useState("BTC");
  const [timeframe, setTimeframe] = useState("1h");
  const [chartType, setChartType] = useState("line");
  const [stats, setStats] = useState<LongShortStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/long-short-stats?symbol=${asset}USDT&period=${timeframe}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.global && data?.top) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [asset, timeframe]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => {
      fetch(`${API_BASE_URL}/api/long-short-stats?symbol=${asset}USDT&period=${timeframe}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data?.global && data?.top) setStats(data); })
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [asset, timeframe]);

  const currentStats = traderType === "top" ? stats?.top : stats?.global;
  const longPct = currentStats ? getRatio(currentStats.longAccount) : 50;

  const traderTypeLabel = traderType === "top"
    ? "탑 트레이더 포지션: 상위 20% 트레이더들의 총 포지션 중 롱/숏 포지션이 차지하는 비율"
    : "전체 트레이더 포지션: 바이낸스 선물 시장 전체 계정의 롱/숏 비율";

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8">
      <div className="max-w-[900px] mx-auto px-3 md:px-8 pt-4 md:pt-8">

        {/* ─── Trader Type Toggle (탑 포지션 / 전체 트레이더) ─── */}
        <div className="flex items-center gap-0 mb-6 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden w-fit">
          <button
            onClick={() => setTraderType("top")}
            className={`px-5 py-2.5 text-sm font-bold transition-all ${traderType === "top" ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-white"}`}
          >
            탑 포지션
          </button>
          <button
            onClick={() => setTraderType("global")}
            className={`px-5 py-2.5 text-sm font-bold transition-all ${traderType === "global" ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-white"}`}
          >
            전체 트레이더
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
          <span className="text-indigo-400 font-bold">{traderType === "top" ? "탑 트레이더 포지션" : "전체 트레이더"}</span>: {traderTypeLabel.split(": ")[1]}
        </p>

        {/* ─── Filters Row ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Symbol */}
          <div className="space-y-1.5">
            <p className="text-xs text-neutral-600 font-bold uppercase tracking-wider">심볼</p>
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {ASSETS.map((a) => (
                <button
                  key={a.symbol}
                  onClick={() => setAsset(a.symbol)}
                  className={`flex-1 px-2 py-2 text-xs font-bold transition-colors ${asset === a.symbol ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-white"}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div className="space-y-1.5">
            <p className="text-xs text-neutral-600 font-bold uppercase tracking-wider">기간</p>
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`flex-1 px-2 py-2 text-xs font-bold transition-colors ${timeframe === tf.value ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Type */}
          <div className="space-y-1.5">
            <p className="text-xs text-neutral-600 font-bold uppercase tracking-wider">차트</p>
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {CHART_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setChartType(ct.value)}
                  className={`flex-1 px-2 py-2 text-xs font-bold transition-colors ${chartType === ct.value ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Long/Short Gauge ─── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <LongShortGauge
              longPct={longPct}
              label={`${asset}USDT · ${traderType === "top" ? "탑 트레이더" : "전체 트레이더"} · 바이낸스 선물`}
            />
          )}
        </div>

        {/* ─── Chart ─── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {asset} 롱/숏 비율 추세
              </h2>
              <span className="text-xs text-neutral-600">
                {TIMEFRAMES.find(t => t.value === timeframe)?.label} · {traderType === "top" ? "탑" : "전체"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-neutral-600">LIVE</span>
            </div>
          </div>
          <LongShortChartDynamic
            symbol={asset}
            timeframe={timeframe}
            traderType={traderType}
            chartType={chartType}
          />
        </div>

        {/* ─── Footer note ─── */}
        <p className="text-xs text-neutral-700 mt-4 leading-relaxed text-center">
          데이터 출처: Binance Futures API · 30초마다 자동 갱신
        </p>
      </div>
    </div>
  );
}
