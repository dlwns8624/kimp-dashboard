"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { WS_BASE_URL } from "@/lib/constants";
import { useMarketData, type CoinData } from "@/hooks/useMarketData";

const Chart                    = dynamic(() => import("@/components/Chart"),                  { ssr: false });
const WhaleWatch               = dynamic(() => import("@/components/WhaleWatch"),             { ssr: false });
const TradingViewSingleQuote   = dynamic(() => import("@/components/TradingViewSingleQuote"), { ssr: false });


// ─── Types (chat / liquidations only — prices come from useMarketData) ──────
type ChatMessage = { sender: string; text: string; time: number; isSystem?: boolean };

// ─── Chat helpers ────────────────────────────────────────────────────────────
const NICK_POOL = ["고래", "달팽", "별빛", "사자", "곰돌", "토끼", "여우", "청매", "폭풍", "번개", "파랑", "무지"];
const generateNickname = () => NICK_POOL[Math.floor(Math.random() * NICK_POOL.length)];
const MSG_TTL_MS = 20 * 60 * 1000; // 20분
type Liquidation = { symbol: string; side: "BUY" | "SELL"; price: number; qty: number; time: number };
type SortKey     = "symbol" | "price" | "premium" | "volume" | "marketCap";
type SortOrder   = "asc" | "desc";
type Exchange    = "upbit" | "bithumb";
type RightTab    = "whale" | "liquidation";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtKrw(v: number): string {
  if (!v) return "-";
  return "₩" + v.toLocaleString("ko-KR", {
    maximumFractionDigits: v >= 100 ? 0 : v >= 1 ? 2 : 6,
  });
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function Home() {
  // ── Market data (직접 호출 — Render 서버 슬립 무관) ──
  const market = useMarketData();

  // ── Chat / Liquidations via backend WebSocket ──
  const [chatParams, setChatParams]     = useState<ChatMessage[]>([]);
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [wsConnected, setWsConnected]   = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // ── UI state ──
  const [sortKey, setSortKey]         = useState<SortKey>("marketCap");
  const [sortOrder, setSortOrder]     = useState<SortOrder>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [exchange, setExchange]       = useState<Exchange>("upbit");
  const [rightTab, setRightTab]       = useState<RightTab>("whale");
  const [showAllCoins, setShowAllCoins]   = useState(false);
  const [expandedMacro, setExpandedMacro] = useState<"nasdaq" | "gold" | "fx" | null>(null);
  // Chat popup
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatInput, setChatInput]       = useState("");
  const [unreadCount, setUnreadCount]   = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [nickname, setNickname]         = useState<string>("");
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [nicknameInput, setNicknameInput]     = useState("");
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const [notiEnabled, setNotiEnabled]       = useState(false);
  const [notiTargetKimp, setNotiTargetKimp] = useState<number>(3);
  const lastNotified = useRef<Record<string, number>>({});

  // ── Notifications ─────────────────────────────────────────────────────
  const checkNotifications = useCallback((coins: Record<string, CoinData>) => {
    if (!notiEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
    const now = Date.now();
    Object.values(coins).forEach(coin => {
      const prem     = coin.premium;
      const lastTime = lastNotified.current[coin.symbol] || 0;
      if (prem >= notiTargetKimp && now - lastTime > 5 * 60_000) {
        lastNotified.current[coin.symbol] = now;
        new Notification("Kimp Alert", { body: `${coin.symbol} 업비트 김프 ${prem.toFixed(2)}% 도달!` });
      }
    });
  }, [notiEnabled, notiTargetKimp]);

  useEffect(() => {
    if (market.isLive) checkNotifications(market.coins);
  }, [market.coins, market.isLive, checkNotifications]);

  // ── Backend WebSocket (chat + liquidations only) ───────────────────────
  useEffect(() => {
    const connectWs = () => {
      try {
        const ws = new WebSocket(WS_BASE_URL);
        wsRef.current = ws;
        ws.onopen  = () => setWsConnected(true);
        ws.onmessage = (event) => {
          try {
            const msg  = JSON.parse(event.data);
            const type = msg.type?.toUpperCase();
            if (type === "CHAT") {
              const m = msg.payload || msg.data;
              if (m) {
                setChatParams(prev => [...prev, m].slice(-100));
                setChatOpen(open => { if (!open) setUnreadCount(n => n + 1); return open; });
              }
            } else if (type === "CHAT_HISTORY") {
              const history = msg.payload;
              if (Array.isArray(history) && history.length > 0) {
                setChatParams(history.slice(-100));
              }
            } else if (type === "LIQUIDATION") {
              const l = msg.payload || msg.data;
              const WATCHED = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT"];
              if (l && WATCHED.includes((l.symbol || "").toUpperCase())) {
                setLiquidations(prev => [l, ...prev].slice(0, 60));
                const sym = l.symbol.replace("USDT", "");
                const isLong = l.side === "SELL";
                const amount = (l.price * l.qty).toLocaleString("en-US", { maximumFractionDigits: 0 });
                const alertMsg: ChatMessage = {
                  sender: "🔔 청산 알림",
                  text: `${isLong ? "🔻 롱청산" : "🔺 숏청산"} ${sym} $${amount}`,
                  time: l.time || Date.now(),
                  isSystem: true,
                };
                setChatParams(prev => [...prev, alertMsg].slice(-100));
                setChatOpen(open => { if (!open) setUnreadCount(n => n + 1); return open; });
              }
            }
          } catch { /* ignore */ }
        };
        ws.onclose = () => { setWsConnected(false); setTimeout(connectWs, 5000); };
        ws.onerror = () => ws.close();
      } catch { /* ignore — 서버 슬립 중이어도 가격은 훅에서 직접 로드됨 */ }
    };
    connectWs();
    return () => wsRef.current?.close();
  }, []);

  const setupNotifications = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setNotiEnabled(!notiEnabled);
    } else if (Notification.permission !== "denied") {
      const p = await Notification.requestPermission();
      if (p === "granted") setNotiEnabled(true);
    }
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "CHAT_MSG",
      text: chatInput,
      sender: nickname || generateNickname(),
    }));
    setChatInput("");
  };

  const saveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nicknameInput.trim().slice(0, 8);
    if (!trimmed) return;
    setNickname(trimmed);
    localStorage.setItem("kimp_nickname", trimmed);
    setNicknameEditing(false);
  };

  const toggleChat = () => {
    setChatOpen(o => {
      if (!o) {
        setUnreadCount(0);
        // 닉네임 없으면 자동 생성
        const saved = localStorage.getItem("kimp_nickname");
        if (!saved) {
          const nick = generateNickname();
          setNickname(nick);
          localStorage.setItem("kimp_nickname", nick);
        }
        // 열 때 맨 아래로 스크롤
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
      return !o;
    });
  };

  // 채팅창 열려있을 때 새 메시지 오면 자동 스크롤
  useEffect(() => {
    if (chatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatParams, chatOpen]);

  // localStorage에서 닉네임 로드
  useEffect(() => {
    const saved = localStorage.getItem("kimp_nickname");
    if (saved) setNickname(saved);
  }, []);

  // 20분 이상된 메시지 주기적으로 제거
  useEffect(() => {
    const id = setInterval(() => {
      setChatParams(prev => prev.filter(m => Date.now() - m.time < MSG_TTL_MS));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Formatters ───────────────────────────────────────────────────────────
  const fmtNum = (v: number | null | undefined, d = 0) => {
    if (v === null || v === undefined || isNaN(v)) return "-";
    return Number(v).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  const getPremiumBadge = (prem: number) => {
    const label = `${prem > 0 ? "+" : ""}${prem.toFixed(2)}%`;
    if (prem > 3)  return <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/20">{label}</span>;
    if (prem > 0)  return <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-orange-500/10 text-orange-400 border border-orange-500/20">{label}</span>;
    if (prem < -1) return <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/20">{label}</span>;
    if (prem < 0)  return <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-sky-500/10 text-sky-400 border border-sky-500/20">{label}</span>;
    return <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-neutral-800 text-neutral-500 border border-neutral-700">{label}</span>;
  };

  // ── Sorting ──────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortOrder("desc"); }
  };

  const sortedCoins = useMemo(() => {
    let filtered = Object.values(market.coins);
    if (searchTerm) {
      filtered = filtered.filter(c => c.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const isUpbit = exchange === "upbit";
    return filtered.sort((a, b) => {
      let vA: number | string = 0, vB: number | string = 0;
      if      (sortKey === "symbol")    { vA = a.symbol; vB = b.symbol; }
      else if (sortKey === "price")     { vA = isUpbit ? a.krwPrice : a.bithumbPrice;      vB = isUpbit ? b.krwPrice : b.bithumbPrice; }
      else if (sortKey === "premium")   { vA = isUpbit ? a.premium  : a.bithumbPremium;    vB = isUpbit ? b.premium  : b.bithumbPremium; }
      else if (sortKey === "marketCap") { vA = a.marketCap ?? 0; vB = b.marketCap ?? 0; }
      else                              { vA = a.upbitVolumeKrw;  vB = b.upbitVolumeKrw; }
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ?  1 : -1;
      return 0;
    });
  }, [market.coins, sortKey, sortOrder, searchTerm, exchange]);

  const isUpbit  = exchange === "upbit";
  const exColor  = isUpbit ? "#818cf8" : "#fb923c";
  const exBg     = isUpbit ? "rgba(99,102,241,0.05)"  : "rgba(249,115,22,0.05)";
  const exBorder = isUpbit ? "rgba(99,102,241,0.2)"   : "rgba(249,115,22,0.2)";

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 font-sans selection:bg-indigo-500/30 p-1.5 sm:p-2.5 md:p-4">
      <div className="max-w-[1600px] mx-auto space-y-2.5 md:space-y-6">

        {/* ── TOP GRID ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 md:gap-6">

          {/* LEFT SIDEBAR (3/12) — 모바일에선 코인 테이블 아래로 */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-xl h-full">
              <div className="flex justify-between items-center mb-3 md:mb-5 border-b border-neutral-800 pb-2 md:pb-3">
                <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-neutral-500">시장 지표</h2>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${market.isLive ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className="text-[9px] font-bold text-neutral-600">
                    {market.isLive ? "LIVE" : "로딩 중..."}
                  </span>
                </div>
              </div>

              <div className="space-y-2 md:space-y-4">
                {/* 모바일: 글로벌 + 도미넌스 가로로 나란히 */}
                <div className="grid grid-cols-2 md:block gap-2">
                {/* 글로벌 시가총액 */}
                <div className="bg-neutral-950/50 rounded-lg md:rounded-xl p-2 md:p-3 border border-neutral-800/50">
                  <p className="text-[8px] md:text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1 md:mb-2">🌐 글로벌 시총</p>
                  <p className="text-base md:text-xl font-black text-white tracking-tight">
                    ${market.globalMetrics ? (market.globalMetrics.totalMarketCap / 1e12).toFixed(2) + "T" : "-"}
                  </p>
                  <p className="text-[9px] text-neutral-500 mt-0.5 md:mt-1">
                    Vol <span className="text-neutral-400 font-bold">${fmtNum((market.globalMetrics?.totalVolume ?? 0) / 1e9, 0)}B</span>
                  </p>
                </div>

                {/* BTC 도미넌스 */}
                <div className="bg-neutral-950/50 rounded-lg md:rounded-xl p-2 md:p-3 border border-neutral-800/50">
                  <p className="text-[8px] md:text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1 md:mb-2">₿ BTC 도미</p>
                  <div className="flex items-baseline justify-between mb-1.5 md:mb-2">
                    <p className="text-base md:text-xl font-black text-orange-400">{fmtNum(market.globalMetrics?.btcDominance, 2)}%</p>
                    <p className="text-[9px] text-neutral-600">ETH {fmtNum(market.globalMetrics?.ethDominance, 1)}%</p>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${market.globalMetrics?.btcDominance ?? 0}%`, background: "linear-gradient(90deg,#f97316,#fb923c)" }} />
                  </div>
                </div>
                </div>{/* /grid-cols-2 */}

                {/* 공포·탐욕 */}
                <div className="bg-neutral-950/50 rounded-lg md:rounded-xl p-2 md:p-3 border border-neutral-800/50">
                  <p className="text-[8px] md:text-[9px] font-bold text-neutral-600 uppercase tracking-wider mb-1 md:mb-2">😨 공포·탐욕</p>
                  {market.fearAndGreed ? (() => {
                    const val   = Number(market.fearAndGreed!.value);
                    const color = val >= 75 ? "#10b981" : val >= 55 ? "#84cc16" : val >= 45 ? "#eab308" : val >= 25 ? "#f97316" : "#ef4444";
                    const label = val >= 75 ? "극도 탐욕" : val >= 55 ? "탐욕" : val >= 45 ? "중립" : val >= 25 ? "공포" : "극도 공포";
                    return (
                      <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10 md:w-14 md:h-14 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-10 h-10 md:w-14 md:h-14 -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#262626" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
                              strokeDasharray={`${val} ${100 - val}`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs md:text-base font-black" style={{ color }}>{val}</span>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm font-black text-white">{label}</p>
                          <p className="text-[8px] md:text-[9px] text-neutral-600 mt-0.5">0=공포 · 100=탐욕</p>
                        </div>
                      </div>
                    );
                  })() : <p className="text-neutral-600 text-xs">로딩 중...</p>}
                </div>

                {/* 김프 알림 */}
                <div className="pt-1 border-t border-neutral-800">
                  <div className="flex justify-between items-center mb-2 md:mb-3">
                    <p className="text-[9px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest">🔔 김프 알림</p>
                    <button onClick={setupNotifications}
                      className={`relative inline-flex h-5 w-10 rounded-full transition-all duration-300 ${notiEnabled ? "bg-indigo-500" : "bg-neutral-800 border border-neutral-700"}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-[3px] ml-[3px] shadow-sm ${notiEnabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-950/50 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase">기준 김프</span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={notiTargetKimp}
                        onChange={e => setNotiTargetKimp(Number(e.target.value))}
                        className="w-12 bg-transparent text-white font-bold text-right outline-none focus:text-indigo-400"
                        disabled={!notiEnabled} />
                      <span className="text-[11px] font-bold text-neutral-600">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT (9/12) — 모바일에선 먼저 표시 */}
          <div className="lg:col-span-9 order-1 lg:order-2 space-y-2.5 md:space-y-4">

            {/* Macro Cards — TradingView 실시간 위젯 */}
            {(() => {
              const MACRO_WIDGETS = [
                { key: "nasdaq" as const, symbol: "FOREXCOM:NSXUSD", label: "NASDAQ 100",  tagColor: "text-indigo-400" },
                { key: "gold"   as const, symbol: "OANDA:XAUUSD",    label: "GOLD / USD",  tagColor: "text-orange-400" },
                { key: "fx"     as const, symbol: "FX_IDC:USDKRW",   label: "USD / KRW",   tagColor: "text-emerald-400" },
              ];
              return (
                <>
                  <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                    {MACRO_WIDGETS.map(w => {
                      const isOpen = expandedMacro === w.key;
                      return (
                        <div key={w.key}>
                          <button
                            onClick={() => setExpandedMacro(isOpen ? null : w.key)}
                            className="w-full text-left"
                          >
                            <TradingViewSingleQuote symbol={w.symbol} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {expandedMacro && (() => {
                    const w = MACRO_WIDGETS.find(c => c.key === expandedMacro)!;
                    return (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl md:rounded-2xl overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 border-b border-neutral-800 bg-neutral-950/40">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${w.tagColor}`}>{w.label}</span>
                            <span className="text-[9px] text-neutral-600 font-mono">{w.symbol}</span>
                          </div>
                          <button onClick={() => setExpandedMacro(null)}
                            className="text-neutral-600 hover:text-white text-xs font-black px-2 py-1 rounded-lg hover:bg-neutral-800 transition-all">✕</button>
                        </div>
                        <Chart
                          symbol={w.symbol}
                          tvSymbol={w.symbol}
                          displayName={w.label}
                          subName="TradingView · Macro"
                        />
                      </div>
                    );
                  })()}
                </>
              );
            })()}

            {/* Assets Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">

              {/* Toolbar */}
              <div className="px-2.5 py-2 md:px-4 md:py-3 border-b border-neutral-800 flex flex-wrap justify-between items-center gap-2 bg-neutral-900/40">
                <div className="flex items-center gap-3">
                  <div className="flex bg-neutral-950 p-0.5 rounded-xl border border-neutral-800">
                    <button onClick={() => setExchange("upbit")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${exchange === "upbit" ? "bg-indigo-600 text-white shadow" : "text-neutral-500"}`}>
                      업비트
                    </button>
                    <button onClick={() => setExchange("bithumb")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${exchange === "bithumb" ? "bg-orange-500 text-white shadow" : "text-neutral-500"}`}>
                      빗썸
                    </button>
                  </div>
                  {/* 데이터 출처 표시 */}
                  <span className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-neutral-600">
                    김프 기준:
                    <span className="text-yellow-500 font-black">Binance</span>
                    <span className="text-neutral-700">(트레이딩뷰)</span>
                  </span>
                </div>
                <div className="relative w-full sm:w-56 group">
                  <input type="text" placeholder="코인 검색..."
                    className="w-full bg-neutral-950 text-xs text-white pl-9 pr-4 py-2 rounded-xl border border-neutral-800 outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:font-medium placeholder:text-neutral-600"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-indigo-500 transition-colors text-sm">🔍</span>
                </div>
              </div>

              {/* Table — 모바일에서 overflow 없이 꽉 차게 */}
              <div className="md:overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed md:table-auto">
                  <thead>
                    <tr className="bg-neutral-950/40">
                      <th className="w-[30%] md:w-auto px-2 md:px-3 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 cursor-pointer hover:text-neutral-300"
                        onClick={() => handleSort("symbol")}>
                        코인 {sortKey === "symbol" && <span style={{ color: exColor }}>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </th>
                      <th className="hidden md:table-cell px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 text-right cursor-pointer hover:text-neutral-300"
                        onClick={() => handleSort("marketCap")}>
                        시가총액 {sortKey === "marketCap" && <span className="text-indigo-400">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </th>
                      {/* 바이낸스 기준가: 데스크탑 lg+ 에서만 표시 */}
                      <th className="hidden lg:table-cell px-3 py-2 text-[9px] font-black uppercase tracking-widest text-yellow-600 border-b border-neutral-800 text-right">
                        바이낸스 기준가
                      </th>
                      <th className="w-[35%] md:w-auto px-2 md:px-3 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest border-b border-neutral-800 text-right cursor-pointer hover:text-neutral-300"
                        style={{ color: isUpbit ? "#818cf8" : "#fb923c" }}
                        onClick={() => handleSort("price")}>
                        시세 {sortKey === "price" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </th>
                      <th className="w-[20%] md:w-auto px-2 md:px-3 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest border-b border-neutral-800 text-right cursor-pointer hover:text-neutral-300"
                        style={{ color: isUpbit ? "#818cf8" : "#fb923c" }}
                        onClick={() => handleSort("premium")}>
                        김프 {sortKey === "premium" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </th>
                      <th className="w-[15%] md:w-auto px-1 md:px-3 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 text-right">
                        등락
                      </th>
                      <th className="hidden md:table-cell px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 text-right cursor-pointer hover:text-neutral-300"
                        onClick={() => handleSort("volume")}>
                        거래량 {sortKey === "volume" && <span className="text-indigo-400">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/30">
                    {sortedCoins.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">
                              Binance · Upbit · Bithumb 연결 중...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (showAllCoins ? sortedCoins : sortedCoins.slice(0, 15)).map((coin: CoinData) => {
                      const price      = isUpbit ? coin.krwPrice    : coin.bithumbPrice;
                      const premium    = isUpbit ? coin.premium      : coin.bithumbPremium;
                      const changeRate = isUpbit ? coin.upbitChangeRate : coin.binanceChangeRate / 100;
                      const ok         = price > 0;
                      const isExpanded = expandedRow === coin.symbol;

                      return (
                        <React.Fragment key={coin.symbol}>
                          <tr className={`cursor-pointer transition-all duration-150 ${isExpanded ? "bg-neutral-800/20" : "hover:bg-neutral-800/15"}`}
                            onClick={() => setExpandedRow(isExpanded ? null : coin.symbol)}>

                            {/* 코인 */}
                            <td className="px-2 md:px-3 py-2 md:py-2.5">
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <div className="w-6 h-6 md:w-7 md:h-7 rounded-md md:rounded-lg border flex items-center justify-center font-black text-[9px] md:text-[10px] shrink-0"
                                  style={{ borderColor: exBorder, color: exColor, backgroundColor: exBg }}>
                                  {coin.symbol.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-black text-white text-[10px] md:text-xs block leading-none truncate">{coin.symbol}</span>
                                  <span className="text-[7px] md:text-[8px] font-bold text-neutral-700">/KRW</span>
                                </div>
                              </div>
                            </td>

                            {/* 시가총액 (desktop only) */}
                            <td className="hidden md:table-cell px-3 py-2.5 text-right">
                              <p className="font-black text-neutral-400 text-xs">
                                {!coin.marketCap || isNaN(coin.marketCap) ? "-"
                                  : coin.marketCap > 1e12 ? "$" + (coin.marketCap / 1e12).toFixed(1) + "T"
                                  : "$" + (coin.marketCap / 1e9).toFixed(1) + "B"}
                              </p>
                            </td>

                            {/* 바이낸스 기준가 (lg+ only) */}
                            <td className="hidden lg:table-cell px-3 py-2.5 text-right">
                              <p className="text-xs font-black text-yellow-600/80">{fmtKrw(coin.binanceKrwEquiv)}</p>
                              <p className="text-[9px] text-neutral-700 font-mono mt-0.5">
                                ${coin.binanceUsdPrice.toLocaleString("en-US", { maximumFractionDigits: coin.binanceUsdPrice >= 1 ? 2 : 6 })}
                              </p>
                            </td>

                            {/* 시세 */}
                            <td className="px-2 md:px-3 py-2 md:py-2.5 text-right">
                              {ok ? (
                                <>
                                  <p className="font-black text-white text-xs md:text-sm leading-none">{fmtKrw(price)}</p>
                                  {/* 모바일: 바이낸스 기준가 작은 글씨로 표시 */}
                                  {coin.binanceUsdPrice > 0 && (
                                    <p className="md:hidden text-[8px] font-mono text-yellow-600/70 mt-0.5 leading-none">
                                      ${coin.binanceUsdPrice >= 1
                                        ? coin.binanceUsdPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })
                                        : coin.binanceUsdPrice.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="text-[9px] text-neutral-700 font-bold">미상장</span>
                              )}
                            </td>

                            {/* 김프 */}
                            <td className="px-1 md:px-3 py-2 md:py-2.5 text-right">
                              {ok && premium != null ? (
                                <span className={`inline-block px-1 md:px-2 py-0.5 rounded text-[9px] md:text-[11px] font-black ${
                                  premium > 3  ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" :
                                  premium > 0  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                  premium < -1 ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
                                  premium < 0  ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                                  "bg-neutral-800 text-neutral-500 border border-neutral-700"
                                }`}>
                                  {premium > 0 ? "+" : ""}{premium.toFixed(2)}%
                                </span>
                              ) : <span className="text-neutral-700 text-xs">-</span>}
                            </td>

                            {/* 등락률 */}
                            <td className="px-1 md:px-3 py-2 md:py-2.5 text-right">
                              <span className={`text-[10px] md:text-sm font-black ${changeRate > 0 ? "text-rose-500" : changeRate < 0 ? "text-blue-500" : "text-neutral-500"}`}>
                                {changeRate > 0 ? "▲" : changeRate < 0 ? "▼" : ""}
                                {Math.abs(changeRate * 100).toFixed(1)}%
                              </span>
                            </td>

                            {/* 거래량 (desktop only) */}
                            <td className="hidden md:table-cell px-3 py-2.5 text-right">
                              <p className="font-black text-neutral-400 text-xs">
                                {coin.upbitVolumeKrw > 0 ? fmtNum(coin.upbitVolumeKrw / 1e8, 0) + "억" : "-"}
                              </p>
                              <p className="text-[8px] font-bold text-neutral-700 mt-0.5">
                                BIN ${fmtNum(coin.binanceVolumeUsdt / 1e6, 0)}M
                              </p>
                            </td>
                          </tr>

                          {/* 차트 확장 */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-0 border-b border-neutral-800 bg-neutral-900/40">
                                <div className="p-2 md:p-6">
                                  <Chart symbol={coin.symbol} upbitSymbol={coin.upbitSymbol} />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 더 보기 / 접기 버튼 */}
              {sortedCoins.length > 15 && (
                <div className="border-t border-neutral-800 bg-neutral-950/20">
                  <button
                    onClick={() => setShowAllCoins(s => !s)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-xs font-black text-neutral-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all group"
                  >
                    {showAllCoins ? (
                      <>
                        <span className="text-base leading-none group-hover:scale-110 transition-transform">▲</span>
                        <span>상위 15개만 보기</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base leading-none group-hover:scale-110 transition-transform">▼</span>
                        <span>전체 {sortedCoins.length}개 코인 더 보기</span>
                        <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-black">
                          +{sortedCoins.length - 15}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950/30 flex justify-between items-center">
                <p className="text-[10px] text-neutral-600 font-bold">
                  {showAllCoins ? sortedCoins.length : Math.min(15, sortedCoins.length)}개 표시 / 전체 {sortedCoins.length}개
                </p>
                {market.updatedAt && (
                  <p className="text-[10px] text-neutral-700">{new Date(market.updatedAt).toLocaleTimeString("ko-KR")}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTION: Whale + Liquidations (full width) ─── */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden">
            <div className="flex border-b border-neutral-800 bg-neutral-900/60 shrink-0">
              <button onClick={() => setRightTab("whale")}
                className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-black uppercase tracking-widest transition-all border-b-2 ${rightTab === "whale" ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" : "text-neutral-500 border-transparent hover:text-neutral-300"}`}>
                🐋 고래 거래
              </button>
              <button onClick={() => setRightTab("liquidation")}
                className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-black uppercase tracking-widest transition-all border-b-2 ${rightTab === "liquidation" ? "text-rose-400 border-rose-500 bg-rose-500/5" : "text-neutral-500 border-transparent hover:text-neutral-300"}`}>
                🔥 청산 감지
              </button>
              <div className="ml-auto flex items-center px-4">
                <span className="text-[9px] md:text-[10px] font-bold text-neutral-600 font-mono">Real-time · Binance</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {rightTab === "whale" ? (
                <WhaleWatch />
              ) : (
                <div className="h-full overflow-y-auto">
                  {liquidations.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-neutral-800 border-t-rose-500/50 rounded-full animate-spin" />
                      <p className="text-sm md:text-base font-black text-neutral-600 uppercase tracking-widest">
                        BTC · ETH · SOL · XRP · BNB 청산 대기 중...
                      </p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm">
                        <tr className="border-b border-neutral-800">
                          <th className="px-2 md:px-4 py-2 text-left text-[9px] md:text-xs font-black text-neutral-500 uppercase tracking-wider">코인</th>
                          <th className="px-2 md:px-4 py-2 text-left text-[9px] md:text-xs font-black text-neutral-500 uppercase tracking-wider">유형</th>
                          <th className="px-2 md:px-4 py-2 text-right text-[9px] md:text-xs font-black text-neutral-500 uppercase tracking-wider">청산금액</th>
                          <th className="px-2 md:px-4 py-2 text-right text-[9px] md:text-xs font-black text-neutral-500 uppercase tracking-wider hidden md:table-cell">가격</th>
                          <th className="px-2 md:px-4 py-2 text-right text-[9px] md:text-xs font-black text-neutral-500 uppercase tracking-wider">시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liquidations.map((liq, i) => {
                          const sym = liq.symbol.replace("USDT", "");
                          const isLong = liq.side === "SELL";
                          const COIN_COLORS: Record<string, { bg: string; text: string }> = {
                            BTC: { bg: "rgba(247,147,26,0.15)", text: "#f7931a" },
                            ETH: { bg: "rgba(98,126,234,0.15)", text: "#627eea" },
                            SOL: { bg: "rgba(153,69,255,0.15)", text: "#9945ff" },
                            XRP: { bg: "rgba(0,154,218,0.15)", text: "#009ada" },
                            BNB: { bg: "rgba(243,186,47,0.15)", text: "#f3ba2f" },
                          };
                          const coinColor = COIN_COLORS[sym] ?? { bg: "rgba(255,255,255,0.05)", text: "#a3a3a3" };
                          return (
                            <tr
                              key={i}
                              className={`border-b border-neutral-800/30 transition-colors hover:bg-neutral-800/20 ${i === 0 ? "animate-pulse" : ""}`}
                            >
                              {/* 코인 로고 + 심볼 */}
                              <td className="px-2 md:px-4 py-2 md:py-2.5">
                                <div className="flex items-center gap-1.5 md:gap-2.5">
                                  <div
                                    className="w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center font-black text-[11px] md:text-sm shrink-0"
                                    style={{ background: coinColor.bg, color: coinColor.text, border: `1px solid ${coinColor.text}30` }}
                                  >
                                    {sym.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-[11px] md:text-sm font-black text-white leading-none">{sym}</p>
                                    <p className="text-[8px] md:text-[10px] text-neutral-600 font-mono mt-0.5 hidden sm:block">PERP</p>
                                  </div>
                                </div>
                              </td>
                              {/* 유형 */}
                              <td className="px-2 md:px-4 py-2 md:py-2.5">
                                <span className={`inline-flex items-center gap-1 px-1.5 md:px-2.5 py-1 rounded-md md:rounded-lg text-[9px] md:text-xs font-black whitespace-nowrap ${
                                  isLong ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                }`}>
                                  {isLong ? "🔻롱청산" : "🔺숏청산"}
                                </span>
                              </td>
                              {/* 청산금액 */}
                              <td className="px-2 md:px-4 py-2 md:py-2.5 text-right">
                                <p className={`text-[11px] md:text-sm font-black whitespace-nowrap ${isLong ? "text-rose-400" : "text-emerald-400"}`}>
                                  ${fmtNum(liq.price * liq.qty, 0)}
                                </p>
                              </td>
                              {/* 가격 */}
                              <td className="px-2 md:px-4 py-2 md:py-2.5 text-right hidden md:table-cell">
                                <p className="text-[10px] md:text-xs text-neutral-400 font-mono font-bold">
                                  ${fmtNum(liq.price, liq.price >= 100 ? 2 : liq.price >= 1 ? 4 : 6)}
                                </p>
                              </td>
                              {/* 시간 */}
                              <td className="px-2 md:px-4 py-2 md:py-2.5 text-right">
                                <p className="text-[9px] md:text-xs text-neutral-500 font-mono whitespace-nowrap">
                                  {new Date(liq.time).toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── FLOATING CHAT WIDGET ─────────────────────────────────── */}
      {chatOpen && (
        <div className="fixed bottom-[136px] md:bottom-20 right-2 md:right-4 z-50 w-[calc(100vw-16px)] sm:w-[380px] h-[420px] md:h-[480px] bg-neutral-900 border border-neutral-700 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-3.5 pt-3 pb-2 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-600"}`} />
                <span className="text-xs font-black uppercase tracking-widest text-neutral-100">KIMP Chat</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${wsConnected ? "bg-indigo-500/20 text-indigo-400" : "bg-neutral-800 text-neutral-500"}`}>
                  {wsConnected ? "LIVE" : "재연결 중..."}
                </span>
              </div>
              <button onClick={toggleChat}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all text-xs font-black">
                ✕
              </button>
            </div>
            {/* Nickname row */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider shrink-0">닉네임</span>
              {nicknameEditing ? (
                <form onSubmit={saveNickname} className="flex items-center gap-1.5 flex-1">
                  <input
                    ref={nicknameInputRef}
                    type="text"
                    value={nicknameInput}
                    onChange={e => setNicknameInput(e.target.value.slice(0, 8))}
                    className="flex-1 bg-neutral-800 text-white text-[11px] font-bold px-2 py-1 rounded-lg border border-indigo-500/60 outline-none"
                    maxLength={8}
                    placeholder="최대 8자"
                    autoFocus
                  />
                  <button type="submit" className="text-[10px] text-indigo-400 font-black px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-all shrink-0">저장</button>
                  <button type="button" onClick={() => setNicknameEditing(false)} className="text-[10px] text-neutral-500 font-bold px-1.5 py-1 rounded-lg hover:bg-neutral-800 transition-all shrink-0">취소</button>
                </form>
              ) : (
                <button
                  onClick={() => { setNicknameInput(nickname); setNicknameEditing(true); setTimeout(() => nicknameInputRef.current?.focus(), 30); }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-neutral-800 transition-all group"
                >
                  <span className="text-[11px] font-black text-indigo-300">{nickname || "닉네임 없음"}</span>
                  <span className="text-[10px] text-neutral-600 group-hover:text-neutral-400 transition-colors">✏️</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages — 20분 이내 메시지만 표시 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(() => {
              const visible = chatParams.filter(m => Date.now() - m.time < MSG_TTL_MS);
              if (visible.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-700">
                    <span className="text-2xl">💬</span>
                    <p className="text-[10px] font-bold">시장 정황을 공유해보세요</p>
                    <p className="text-[9px] text-neutral-700">최근 20분 이내 메시지만 표시됩니다</p>
                  </div>
                );
              }
              return visible.map((msg, i) => {
                if (msg.isSystem) {
                  // 청산 알림 시스템 메시지
                  const isLong = msg.text.includes("🔻");
                  return (
                    <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${
                      isLong
                        ? "bg-rose-500/8 border-rose-500/20"
                        : "bg-emerald-500/8 border-emerald-500/20"
                    }`}>
                      <span className="text-sm shrink-0">{isLong ? "🔻" : "🔺"}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[10px] font-black leading-none mb-0.5 ${isLong ? "text-rose-400" : "text-emerald-400"}`}>
                          {msg.text.replace("🔻 ", "").replace("🔺 ", "")}
                        </p>
                        <p className="text-[8px] text-neutral-600 font-mono">
                          {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                }
                const isMe = msg.sender === nickname;
                return (
                  <div key={i} className={`flex items-start gap-2.5 group ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-black transition-all
                      ${isMe ? "bg-indigo-600/30 border border-indigo-500/40 text-indigo-300" : "bg-neutral-800 border border-neutral-700 text-neutral-500 group-hover:border-indigo-500/30"}`}>
                      {msg.sender.charAt(0)}
                    </div>
                    <div className={`min-w-0 max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`flex items-baseline gap-1.5 mb-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                        <span className={`font-bold text-[10px] ${isMe ? "text-indigo-300" : "text-neutral-100"}`}>{msg.sender}</span>
                        <span className="text-[8px] text-neutral-600 font-mono">
                          {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed break-all px-2.5 py-1.5 rounded-xl
                        ${isMe ? "bg-indigo-600/20 text-indigo-100 rounded-tr-none" : "bg-neutral-800/60 text-neutral-300 rounded-tl-none"}`}>
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendChat} className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center gap-2 shrink-0">
            <input type="text" placeholder="메시지 입력..."
              className="flex-1 bg-neutral-800/80 text-xs text-white outline-none px-3 py-2 rounded-xl border border-neutral-700 focus:border-indigo-500/60 transition-all font-medium placeholder:text-neutral-600"
              value={chatInput} onChange={e => setChatInput(e.target.value)} />
            <button type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all">
              전송
            </button>
          </form>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-[68px] md:bottom-4 right-3 md:right-4 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          chatOpen
            ? "bg-neutral-700 hover:bg-neutral-600"
            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30"
        }`}
      >
        {chatOpen ? (
          <span className="text-white text-lg font-black">✕</span>
        ) : (
          <span className="text-xl">💬</span>
        )}
        {/* 안읽음 뱃지 */}
        {!chatOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-neutral-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
