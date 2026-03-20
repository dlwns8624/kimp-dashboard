"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type WhaleTrade = {
  id: string;
  time: number;
  price: number;
  qty: number;
  value: number;
  isBuy: boolean;
};

const MIN_AMOUNTS = [
  { label: "$5K",   value: 5_000 },
  { label: "$10K",  value: 10_000 },
  { label: "$50K",  value: 50_000 },
  { label: "$100K", value: 100_000 },
];

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT"];

const fmt$ = (v: number) => {
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000)     return "$" + (v / 1_000).toFixed(0) + "K";
  return "$" + v.toFixed(0);
};

export default function WhaleWatch() {
  const [trades, setTrades]       = useState<WhaleTrade[]>([]);
  const [connected, setConnected] = useState(false);
  const [symbol, setSymbol]       = useState("BTCUSDT");
  const [minAmount, setMinAmount] = useState(10_000);
  const [tick, setTick]           = useState(0);

  const allRef      = useRef<WhaleTrade[]>([]);
  const batchRef    = useRef<WhaleTrade[]>([]);
  const wsRef       = useRef<WebSocket | null>(null);
  const minRef      = useRef(minAmount);
  useEffect(() => { minRef.current = minAmount; }, [minAmount]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;
    let retries   = 0;
    allRef.current = [];

    const connect = () => {
      if (destroyed || retries >= 5) return;
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@aggTrade`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (!destroyed) { setConnected(true); retries = 0; }
      };

      ws.onmessage = (e) => {
        try {
          const d     = JSON.parse(e.data);
          const price = parseFloat(d.p);
          const qty   = parseFloat(d.q);
          const value = price * qty;
          if (value < minRef.current) return;

          const trade: WhaleTrade = {
            id: String(d.a), time: Number(d.T), price, qty, value,
            isBuy: !d.m, // m=true → buyer is maker → sell order filled
          };
          batchRef.current.push(trade);
          allRef.current = [trade, ...allRef.current].slice(0, 10_000);
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        if (!destroyed) {
          setConnected(false);
          retries++;
          setTimeout(connect, Math.min(3_000 * retries, 30_000));
        }
      };
      ws.onerror = () => ws.close();
    };

    connect();

    const flush = setInterval(() => {
      if (batchRef.current.length === 0) return;
      const batch = [...batchRef.current];
      batchRef.current = [];
      setTrades(prev => [...batch, ...prev].slice(0, 100));
      setTick(t => t + 1);
    }, 100);

    return () => {
      destroyed = true;
      wsRef.current?.close();
      clearInterval(flush);
    };
  }, [symbol]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const compute = (ms: number) => {
      const cutoff = Date.now() - ms;
      const rel    = allRef.current.filter(t => t.time > cutoff && t.value >= minAmount);
      return {
        buy:      rel.filter(t =>  t.isBuy).reduce((s, t) => s + t.value, 0),
        sell:     rel.filter(t => !t.isBuy).reduce((s, t) => s + t.value, 0),
        buyCount: rel.filter(t =>  t.isBuy).length,
        sellCount:rel.filter(t => !t.isBuy).length,
      };
    };
    return {
      h1:  compute(3_600_000),
      h4:  compute(14_400_000),
      h12: compute(43_200_000),
      h24: compute(86_400_000),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, minAmount]);

  // ── Chart data (5-min buckets, last 1h) ───────────────────────────────────
  const chartData = useMemo(() => {
    const now      = Date.now();
    const STEP_MS  = 5 * 60_000;
    const N        = 12;

    const buckets = Array.from({ length: N }, (_, i) => {
      const t  = new Date(now - (N - 1 - i) * STEP_MS);
      const hh = t.getHours().toString().padStart(2, "0");
      const mm = (Math.floor(t.getMinutes() / 5) * 5).toString().padStart(2, "0");
      return { time: `${hh}:${mm}`, 매수: 0, 매도: 0 };
    });

    allRef.current
      .filter(t => t.time > now - 60 * 60_000 && t.value >= minAmount)
      .forEach(t => {
        const idx = N - 1 - Math.floor((now - t.time) / STEP_MS);
        if (idx >= 0 && idx < N) {
          if (t.isBuy) buckets[idx].매수 += t.value / 1_000;
          else         buckets[idx].매도 += t.value / 1_000;
        }
      });

    return buckets;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, minAmount]);

  const visible = useMemo(
    () => trades.filter(t => t.value >= minAmount),
    [trades, minAmount]
  );

  const ticker = symbol.replace("USDT", "");

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-neutral-800 shrink-0">
        <div className="flex bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
          {SYMBOLS.map(s => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`px-3 py-1.5 text-xs font-black transition-colors ${
                symbol === s ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {s.replace("USDT", "")}
            </button>
          ))}
        </div>

        <div className="flex bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
          {MIN_AMOUNTS.map(m => (
            <button
              key={m.value}
              onClick={() => setMinAmount(m.value)}
              className={`px-3 py-1.5 text-xs font-black transition-colors ${
                minAmount === m.value ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
          <span className="text-xs font-bold text-neutral-500">
            {connected ? "LIVE" : "연결 끊김"}
          </span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 border-b border-neutral-800 shrink-0">
        {(["h1","h4","h12","h24"] as const).map((k, i) => {
          const s   = stats[k];
          const tot = s.buy + s.sell;
          const pct = tot > 0 ? (s.buy / tot) * 100 : 50;
          return (
            <div key={k} className={`p-2.5 ${i < 3 ? "border-r border-neutral-800" : ""}`}>
              <p className="text-[10px] font-black text-neutral-500 mb-1.5">
                {k === "h1" ? "1H" : k === "h4" ? "4H" : k === "h12" ? "12H" : "24H"}
              </p>
              <p className="text-xs font-black text-emerald-400 leading-none">{fmt$(s.buy)}</p>
              <p className="text-xs font-black text-rose-400 leading-none mt-1">{fmt$(s.sell)}</p>
              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-neutral-800 flex">
                <div className="bg-emerald-500 h-full" style={{ width: `${pct}%` }} />
                <div className="bg-rose-500 h-full flex-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Chart ── */}
      <div className="px-3 pt-2.5 pb-2 border-b border-neutral-800 shrink-0">
        <p className="text-[10px] font-bold text-neutral-500 mb-1.5">
          1시간 고래 거래 <span className="text-neutral-600">($K · 5분 단위)</span>
        </p>
        <ResponsiveContainer width="100%" height={72}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} barGap={1}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 7, fill: "#525252" }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 7, fill: "#525252" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0a0a0a",
                border: "1px solid #262626",
                borderRadius: 6,
                fontSize: 10,
                padding: "4px 8px",
              }}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => [`$${Number(val ?? 0).toFixed(0)}K`]}
            />
            <Bar dataKey="매수" fill="#10b981" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
            <Bar dataKey="매도" fill="#ef4444" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Trade List ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
            <div className="w-7 h-7 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm text-neutral-600 font-bold">
              {connected ? "고래 거래 대기 중..." : "바이낸스 연결 중..."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm">
              <tr>
                {["시간", "가격", "수량", "거래액", "유형"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-2 text-xs font-black uppercase text-neutral-500 border-b border-neutral-800 ${
                      i === 0 ? "" : "text-right"
                    } ${i === 4 ? "text-center" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((t, i) => (
                <tr
                  key={t.id}
                  className={`border-b border-neutral-800/20 transition-all ${
                    i === 0 ? "bg-indigo-500/5 animate-pulse" : "hover:bg-neutral-800/10"
                  } ${t.isBuy ? "border-l-2 border-l-emerald-500/40" : "border-l-2 border-l-rose-500/40"}`}
                >
                  <td className="px-3 py-2 text-xs font-mono text-neutral-500">
                    {new Date(t.time).toLocaleTimeString("ko-KR", { hour12: false })}
                  </td>
                  <td className="px-3 py-2 text-sm font-black text-white text-right">
                    ${t.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-400 text-right">
                    {t.qty >= 1 ? t.qty.toFixed(3) : t.qty.toFixed(4)}{" "}
                    <span className="text-neutral-600">{ticker}</span>
                  </td>
                  <td className="px-3 py-2 text-sm font-black text-right">
                    <span className={t.isBuy ? "text-emerald-400" : "text-rose-400"}>
                      {fmt$(t.value)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs font-black ${
                        t.isBuy
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {t.isBuy ? "▲ 매수" : "▼ 매도"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
