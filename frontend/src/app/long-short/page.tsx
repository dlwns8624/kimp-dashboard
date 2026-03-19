"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { API_BASE_URL, WS_BASE_URL } from "@/lib/constants";

const LongShortChartDynamic = dynamic(() => import("@/components/LongShortChart"), { ssr: false });
const WhaleWatchDynamic = dynamic(() => import("@/components/WhaleWatch"), {
  ssr: false,
  loading: () => <div className="h-full bg-neutral-900 animate-pulse rounded-xl" />,
});

// ─── Types ───────────────────────────────────────────────────────────────────
interface FundingRate {
  symbol: string;
  fundingRate: number;
  markPrice: number;
  nextFundingTime: number;
}

interface Dominance {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  totalVolume: number;
}

interface LongShortStats {
  global: { longAccount: string; shortAccount: string };
  top: { longAccount: string; shortAccount: string };
}

interface CoinData {
  symbol: string;
  premium: number;
  krwPrice: number;
  upbitChangeRate: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getRatio = (val: string | undefined) => {
  const n = parseFloat(val ?? "0.5");
  return isNaN(n) ? 50 : n * 100;
};

const fmtMarketCap = (v: number) => {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${v.toFixed(0)}`;
};

const fmtMsToHHMM = (ms: number) => {
  const diff = ms - Date.now();
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LongShortBar({ long, short, label }: { long: number; short: number; label: string }) {
  const isBullish = long > short;
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="flex justify-between text-xl font-black mb-2">
        <span className="text-emerald-400">{long.toFixed(2)}%</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full self-center ${isBullish ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {isBullish ? "롱 우세" : "숏 우세"}
        </span>
        <span className="text-rose-400">{short.toFixed(2)}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full flex overflow-hidden">
        <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${long}%` }} />
        <div className="bg-rose-500 flex-1" />
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-neutral-600 font-bold uppercase tracking-widest">
        <span>Long</span>
        <span>Short</span>
      </div>
    </div>
  );
}

function DonutChart({ btc, eth }: { btc: number; eth: number }) {
  const others = Math.max(0, 100 - btc - eth);
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const stroke = 18;

  const arc = (startPct: number, pct: number, color: string, key: string) => {
    if (pct <= 0) return null;
    const total = 100;
    const startAngle = (startPct / total) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((startPct + pct) / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = pct > 50 ? 1 : 0;
    return (
      <path
        key={key}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    );
  };

  return (
    <svg width={size} height={size} className="drop-shadow-lg">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f1f1f" strokeWidth={stroke} />
      {arc(0, btc, "#f59e0b", "btc")}
      {arc(btc, eth, "#6366f1", "eth")}
      {arc(btc + eth, others, "#404040", "others")}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize={14} fontWeight="900">
        {btc.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#d97706" fontSize={8} fontWeight="bold">
        BTC DOM
      </text>
    </svg>
  );
}

function FundingRateTable({ rates }: { rates: FundingRate[] }) {
  const [countdown, setCountdown] = useState<string>("--:--:--");

  useEffect(() => {
    if (rates.length === 0) return;
    const target = rates[0].nextFundingTime;
    const tick = () => setCountdown(fmtMsToHHMM(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rates]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 className="text-xs font-black text-white uppercase tracking-wider">펀딩비 (Funding Rate)</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-500">다음 정산까지</span>
          <span className="font-mono text-xs text-amber-400 font-bold">{countdown}</span>
        </div>
      </div>
      <div className="divide-y divide-neutral-800/50">
        {rates.map((r) => {
          const isPositive = r.fundingRate >= 0;
          return (
            <div key={r.symbol} className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/30 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white w-12">{r.symbol}</span>
                {r.markPrice > 0 && (
                  <span className="text-[10px] text-neutral-500">
                    ${r.markPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-black ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {isPositive ? "+" : ""}{r.fundingRate.toFixed(4)}%
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {isPositive ? "롱 비용" : "숏 비용"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KimpSummary({ coins }: { coins: Record<string, CoinData> }) {
  const TOP_COINS = ["BTC", "ETH", "XRP", "SOL", "DOGE", "ADA", "AVAX", "LINK"];
  const rows = TOP_COINS.map((sym) => coins[sym]).filter(Boolean);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800">
        <h3 className="text-xs font-black text-white uppercase tracking-wider">김프 현황 (실시간)</h3>
      </div>
      <div className="divide-y divide-neutral-800/50">
        {rows.length === 0 ? (
          <div className="px-4 py-6 text-center text-neutral-600 text-xs">데이터 로드 중...</div>
        ) : (
          rows.map((coin) => {
            const prem = coin.premium ?? 0;
            const chg = coin.upbitChangeRate * 100;
            return (
              <div key={coin.symbol} className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800/30 transition-colors">
                <span className="text-sm font-black text-white w-12">{coin.symbol}</span>
                <span className="text-[10px] text-neutral-500">
                  {coin.krwPrice > 1000
                    ? `₩${Math.round(coin.krwPrice).toLocaleString()}`
                    : `₩${coin.krwPrice.toFixed(2)}`}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black ${chg >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                  </span>
                  <span
                    className={`text-xs font-black w-14 text-right ${
                      prem > 2 ? "text-amber-400" : prem > 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {prem >= 0 ? "+" : ""}{prem.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="px-4 py-2 border-t border-neutral-800 flex justify-between text-[9px] text-neutral-600 font-bold uppercase">
        <span>심볼</span>
        <span className="mr-8">업비트 가격</span>
        <span>24H 변동 / 김프</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LongShortPage() {
  const [asset, setAsset] = useState("BTC");
  const [timeframe, setTimeframe] = useState("1h");
  const [stats, setStats] = useState<LongShortStats | null>(null);
  const [fundingRates, setFundingRates] = useState<FundingRate[]>([]);
  const [dominance, setDominance] = useState<Dominance | null>(null);
  const [coinData, setCoinData] = useState<Record<string, CoinData>>({});
  const [activeSection, setActiveSection] = useState<"overview" | "whale" | "chart">("overview");

  // Long/Short stats
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/long-short-stats?symbol=${asset}USDT&period=${timeframe}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.global && data?.top) setStats(data); })
      .catch(() => {});
  }, [asset, timeframe]);

  // Funding rates
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/funding-rates`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setFundingRates(data); })
      .catch(() => {});
  }, []);

  // BTC Dominance
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dominance`)
      .then((res) => res.json())
      .then((data) => { if (data?.btcDominance) setDominance(data); })
      .catch(() => {});
  }, []);

  // WebSocket for kimp data
  const initCoinData = useCallback(() => {
    const ws = new WebSocket(WS_BASE_URL);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if ((msg.type === "INIT" || msg.type === "UPDATE") && msg.state?.coins) {
          setCoinData(msg.state.coins);
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => ws.close();
    return ws;
  }, []);

  useEffect(() => {
    const ws = initCoinData();
    return () => ws.close();
  }, [initCoinData]);

  const globalLong = stats?.global ? getRatio(stats.global.longAccount) : 50;
  const globalShort = 100 - globalLong;
  const topLong = stats?.top ? getRatio(stats.top.longAccount) : 50;
  const topShort = 100 - topLong;

  const ASSETS = ["BTC", "ETH", "XRP", "SOL", "DOGE"];
  const TIMEFRAMES = [
    { value: "15m", label: "15분" },
    { value: "1h", label: "1시간" },
    { value: "4h", label: "4시간" },
    { value: "1d", label: "1일" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8">
      {/* ─── Header ─── */}
      <div className="max-w-[1600px] mx-auto px-3 md:px-8 pt-4 md:pt-6 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">롱/숏 종합 대시보드</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20 animate-pulse">LIVE</span>
            </div>
            <p className="text-neutral-500 text-xs">바이낸스 선물 롱/숏 비율 · 펀딩비 · BTC 도미넌스 · 고래 감시</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {ASSETS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAsset(a)}
                  className={`px-3 py-1.5 text-xs font-black transition-colors ${asset === a ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${timeframe === tf.value ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section Tabs (mobile) ─── */}
      <div className="md:hidden sticky top-14 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-3 py-1.5 flex gap-1">
        {(["overview", "whale", "chart"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-1 ${activeSection === s ? "bg-indigo-600 text-white" : "text-neutral-500"}`}
          >
            {s === "overview" ? "개요" : s === "whale" ? "고래" : "차트"}
          </button>
        ))}
      </div>

      <div className="max-w-[1600px] mx-auto px-3 md:px-8 space-y-4">
        {/* ─── Top Row: Dominance + Long/Short Cards ─── */}
        <div className={`${activeSection !== "overview" ? "hidden md:block" : ""}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
            {/* BTC Dominance Card */}
            <div className="md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3">
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider self-start">BTC 시장 점유율</p>
              <DonutChart btc={dominance?.btcDominance ?? 0} eth={dominance?.ethDominance ?? 0} />
              <div className="w-full space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-neutral-400">Bitcoin</span>
                  </div>
                  <span className="font-black text-amber-400">{(dominance?.btcDominance ?? 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-neutral-400">Ethereum</span>
                  </div>
                  <span className="font-black text-indigo-400">{(dominance?.ethDominance ?? 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                    <span className="text-neutral-400">Others</span>
                  </div>
                  <span className="font-black text-neutral-400">{Math.max(0, 100 - (dominance?.btcDominance ?? 0) - (dominance?.ethDominance ?? 0)).toFixed(1)}%</span>
                </div>
                {dominance?.totalMarketCap ? (
                  <div className="pt-1.5 border-t border-neutral-800 flex justify-between items-center">
                    <span className="text-[9px] text-neutral-600 uppercase tracking-wider">총 시총</span>
                    <span className="text-[10px] font-black text-neutral-300">{fmtMarketCap(dominance.totalMarketCap)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Long/Short Cards */}
            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LongShortBar long={globalLong} short={globalShort} label={`${asset} 전체 글로벌 (Binance)`} />
              <LongShortBar long={topLong} short={topShort} label={`${asset} 탑 트레이더 (Binance Top)`} />
              <LongShortBar long={49.12} short={50.88} label="Bybit 추정 (모의)" />
              <LongShortBar long={55.40} short={44.60} label="OKX 추정 (모의)" />
            </div>
          </div>

          {/* ─── Funding Rate + Kimp ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <FundingRateTable rates={fundingRates} />
            <KimpSummary coins={coinData} />
          </div>
        </div>

        {/* ─── Whale Watch ─── */}
        <div className={`${activeSection === "overview" ? "hidden md:block" : activeSection !== "whale" ? "hidden md:block" : ""}`}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden" style={{ height: 560 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">실시간 고래 체결 내역</h2>
              <span className="text-[9px] text-neutral-600">Binance Spot</span>
            </div>
            <div style={{ height: "calc(100% - 45px)" }}>
              <WhaleWatchDynamic />
            </div>
          </div>
        </div>

        {/* ─── Long/Short Trend Chart ─── */}
        <div className={`${activeSection !== "overview" && activeSection !== "chart" ? "hidden md:block" : ""}`}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              {asset} 롱/숏 비율 추세 ({TIMEFRAMES.find(t => t.value === timeframe)?.label})
            </h2>
            <LongShortChartDynamic symbol={asset} timeframe={timeframe} />
          </div>
        </div>
      </div>
    </div>
  );
}
