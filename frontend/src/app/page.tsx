"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { WS_BASE_URL } from "@/lib/constants";

const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });

type CoinData = {
  symbol: string;
  krwPrice: number;
  bithumbPrice: number;
  usdtPrice: number;
  premium: number;
  bithumbPremium: number;
  upbitChangeRate: number;
  upbitVolumeKrw: number;
  binanceChangeRate: number;
  binanceVolumeUsdt: number;
  updatedAt: string;
};

type GlobalMetrics = {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  totalVolume: number;
};

type FearAndGreed = {
  value: string;
  classification: string;
};

type StateData = {
  fxRate: number | null;
  fxUpdatedAt: string | null;
  fearAndGreed: FearAndGreed | null;
  globalMetrics: GlobalMetrics | null;
  nasdaq: number | null;
  gold: number | null;
  coins: Record<string, CoinData>;
  lastError: string | null;
};

type ChatMessage = { sender: string; text: string; time: number };
type Liquidation = { symbol: string; side: "BUY" | "SELL"; price: number; qty: number; time: number };

type SortKey = "symbol" | "price" | "premium" | "volume";
type SortOrder = "asc" | "desc";
type Exchange = "upbit" | "bithumb";

export default function Home() {
  const [data, setData] = useState<StateData | null>(null);
  const [chatParams, setChatParams] = useState<ChatMessage[]>([]);
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [exchange, setExchange] = useState<Exchange>("upbit");
  const [sortKey, setSortKey] = useState<SortKey>("premium");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Chat Input
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Notification States
  const [notiEnabled, setNotiEnabled] = useState(false);
  const [notiTargetKimp, setNotiTargetKimp] = useState<number>(3);
  const lastNotified = useRef<Record<string, number>>({});

  useEffect(() => {
    const connectWs = () => {
      const ws = new WebSocket(WS_BASE_URL);
      wsRef.current = ws;

      wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const type = msg.type?.toUpperCase();
  
        if (type === "INIT" || type === "UPDATE") {
          setData(msg.state);
          if (msg.state?.coins) { // Added null check for msg.state.coins
            checkNotifications(msg.state.coins);
          }
        } else if (type === "CHAT") {
          const chatMsg = msg.payload;
          setChatParams(prev => [...prev, chatMsg].slice(-100));
        } else if (type === "LIQUIDATION") {
          const liqMsg = msg.payload;
          setLiquidations(prev => [liqMsg, ...prev].slice(0, 50));
        }
      } catch (e) {
        console.error("WS Parse Error:", e);
      }
    };

      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 3s...");
        setTimeout(connectWs, 3000);
      };
    };

    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [notiEnabled, notiTargetKimp]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatParams]);

  const checkNotifications = (coins: Record<string, CoinData>) => {
    if (!notiEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
    const now = Date.now();
    Object.values(coins).forEach((coin) => {
      const prem = exchange === "upbit" ? coin.premium : coin.bithumbPremium;
      const lastTime = lastNotified.current[coin.symbol] || 0;
      if (prem >= notiTargetKimp && now - lastTime > 5 * 60 * 1000) {
        lastNotified.current[coin.symbol] = now;
        new Notification("Kimp Alert", { body: `${coin.symbol} premium reached ${prem.toFixed(2)}%!` });
      }
    });
  };

  const setupNotifications = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setNotiEnabled(!notiEnabled);
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") setNotiEnabled(true);
    }
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "CHAT_MSG", text: chatInput, sender: "User_" + Math.floor(Math.random() * 1000) }));
    setChatInput("");
  };

  const formatNumber = (val: any, decimals = 0) => {
    if (val === null || val === undefined || isNaN(val)) return "-";
    return Number(val).toLocaleString("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const getPremiumColor = (premium: number) => {
    if (premium > 0) return "text-red-500 bg-red-500/10 border border-red-500/20";
    if (premium < 0) return "text-blue-500 bg-blue-500/10 border border-blue-500/20";
    return "text-gray-400 bg-gray-500/10 border border-gray-500/20";
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortOrder("desc"); }
  };

  const sortedCoins = useMemo(() => {
    if (!data?.coins || Object.keys(data.coins).length === 0) return [];
    let filtered = Object.values(data.coins);
    if (searchTerm) {
        filtered = filtered.filter(c => c.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return filtered.sort((a, b) => {
      let valA, valB;
      if (sortKey === "symbol") { valA = a.symbol; valB = b.symbol; }
      else if (sortKey === "price") { valA = exchange === "upbit" ? a.krwPrice : a.bithumbPrice; valB = exchange === "upbit" ? b.krwPrice : b.bithumbPrice; }
      else if (sortKey === "premium") { valA = exchange === "upbit" ? a.premium : a.bithumbPremium; valB = exchange === "upbit" ? b.premium : b.bithumbPremium; }
      else { valA = a.upbitVolumeKrw; valB = b.upbitVolumeKrw; }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [data?.coins, sortKey, sortOrder, exchange, searchTerm]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 font-sans selection:bg-indigo-500/30 p-4">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* TOP GRID: Stats & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR: Global Markers (3/12) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl h-full">
              <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-3">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Market Intelligence</h2>
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${data ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} title={data ? 'Live Connection Established' : 'Connecting to Server...'}></div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Global Market Cap</p>
                  <p className="text-2xl font-bold text-neutral-100 tracking-tight">${formatNumber((data?.globalMetrics?.totalMarketCap || 0) / 1e9, 2)}B</p>
                  <p className="text-[10px] text-neutral-500 mt-1">24h Vol: ${formatNumber((data?.globalMetrics?.totalVolume || 0) / 1e9, 2)}B</p>
                </div>
                
                <div className="pt-4 border-t border-neutral-800/50">
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Bitcoin Dominance</p>
                  <div className="flex items-end justify-between mb-2">
                    <p className="text-2xl font-black text-indigo-400">{formatNumber(data?.globalMetrics?.btcDominance, 2)}%</p>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.4)]" style={{ width: `${data?.globalMetrics?.btcDominance || 0}%` }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800/50">
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-2">Fear & Greed</p>
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-black ${Number(data?.fearAndGreed?.value) > 70 ? 'text-emerald-400' : Number(data?.fearAndGreed?.value) > 50 ? 'text-lime-400' : 'text-rose-400'}`}>
                      {data?.fearAndGreed ? data.fearAndGreed.value : "---"}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase">{data?.fearAndGreed?.classification || "Loading..."}</p>
                      <p className="text-[9px] text-neutral-500">Market Sentiment</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-800 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Kimp Alert</p>
                    <button onClick={setupNotifications} className={`relative inline-flex h-5 w-10 rounded-full transition-all duration-300 ${notiEnabled ? 'bg-indigo-500' : 'bg-neutral-800 border border-neutral-700'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-[3px] ml-[3px] shadow-sm ${notiEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-950/50 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase">Threshold</span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={notiTargetKimp} onChange={(e) => setNotiTargetKimp(Number(e.target.value))} className="w-12 bg-transparent text-white font-bold text-right outline-none focus:text-indigo-400" disabled={!notiEnabled}/>
                      <span className="text-[11px] font-bold text-neutral-600">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT: Dashboard & List (9/12) */}
          <div className="lg:col-span-9 space-y-4">
            
            {/* Macro Indicators Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg hover:border-neutral-700 transition-colors">
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">BTC Premium</p>
                <div className="flex items-baseline gap-1">
                    <p className="text-xl font-black text-white">
                      {data?.coins["BTC"] ? formatNumber(exchange === "upbit" ? data.coins["BTC"].premium : data.coins["BTC"].bithumbPremium, 2) : "0.00"}%
                    </p>
                    <span className="text-[10px] text-emerald-500 font-bold">KIMP</span>
                </div>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg">
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">USD/KRW 환율</p>
                <p className="text-xl font-black text-white">₩{data?.fxRate ? formatNumber(data.fxRate, 2) : "1,350.00"}</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg hidden sm:block">
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">Nasdaq 100</p>
                <p className="text-xl font-black text-white">{data?.nasdaq ? formatNumber(data.nasdaq, 1) : "18,245.3"}</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg hidden md:block">
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">Gold (XAU)</p>
                <p className="text-xl font-black text-white">${data?.gold ? formatNumber(data.gold, 1) : "2,154.2"}</p>
              </div>
            </div>

            {/* Assets Table Container */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-opacity-80">
              
              {/* Table Toolbar */}
              <div className="p-4 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-neutral-900/40">
                <div className="flex items-center gap-2">
                  <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    <button 
                      onClick={() => setExchange("upbit")} 
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${exchange === "upbit" ? "bg-indigo-500 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"}`}
                    >UPBIT</button>
                    <button 
                      onClick={() => setExchange("bithumb")} 
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${exchange === "bithumb" ? "bg-orange-500 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"}`}
                    >BITHUMB</button>
                  </div>
                  <div className="h-4 w-px bg-neutral-800 mx-2"></div>
                  <span className="text-[10px] font-black text-neutral-500 uppercase">Vs Binance USDT</span>
                </div>
                
                <div className="relative w-full md:w-72 group">
                  <input 
                    type="text" 
                    placeholder="심볼/코인명 검색..." 
                    className="w-full bg-neutral-950 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl border border-neutral-800 outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:font-medium placeholder:text-neutral-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-indigo-500 transition-colors text-sm">🔍</span>
                </div>
              </div>

              {/* Responsive Table Wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-neutral-950/50">
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 cursor-pointer hover:text-neutral-300 transition-colors" onClick={() => handleSort("symbol")}>
                        Asset {sortKey === "symbol" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 text-right cursor-pointer hover:text-neutral-300 transition-colors" onClick={() => handleSort("price")}>
                        Price ({exchange.toUpperCase()}) {sortKey === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 text-right">
                        Binance Price
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 text-right cursor-pointer hover:text-neutral-300 transition-colors" onClick={() => handleSort("premium")}>
                        Premium (KIMP) {sortKey === "premium" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-neutral-800 text-right cursor-pointer hover:text-neutral-300 transition-colors" onClick={() => handleSort("volume")}>
                        24H Vol (KRW) {sortKey === "volume" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {sortedCoins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-32 text-center text-neutral-600 bg-neutral-900/20">
                          <div className="flex flex-col items-center gap-5">
                            <div className="w-12 h-12 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="font-bold text-xs uppercase tracking-[0.2em]">{data ? "Aggregating Market Data..." : "Connecting To Real-time Cluster..."}</p>
                          </div>
                        </td>
                      </tr>
                    ) : sortedCoins.map((coin) => {
                      const price = exchange === "upbit" ? coin.krwPrice : coin.bithumbPrice;
                      const premium = exchange === "upbit" ? coin.premium : coin.bithumbPremium;
                      return (
                        <React.Fragment key={coin.symbol}>
                          <tr className="hover:bg-neutral-800/30 cursor-pointer group transition-all duration-150" onClick={() => setExpandedRow(expandedRow === coin.symbol ? null : coin.symbol)}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/5 group-hover:bg-indigo-500/10 border border-neutral-800 group-hover:border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 group-hover:text-indigo-300 transition-all text-xs">{coin.symbol.charAt(0)}</div>
                                <div>
                                  <span className="font-black text-white group-hover:text-indigo-300 transition-colors block leading-none mb-1">{coin.symbol}</span>
                                  <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest border border-neutral-800 px-1 rounded bg-neutral-950">Active</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <p className="font-black text-[15px] text-white">₩{formatNumber(price, 0)}</p>
                              <p className={`text-[10px] font-bold mt-0.5 ${coin.upbitChangeRate > 0 ? "text-rose-500" : "text-blue-500"}`}>
                                {coin.upbitChangeRate > 0 ? "▲" : "▼"} {formatNumber(Math.abs(coin.upbitChangeRate * 100), 2)}%
                              </p>
                            </td>
                            <td className="p-4 text-right">
                              <p className="font-bold text-neutral-100 text-sm">${formatNumber(coin.usdtPrice, 2)}</p>
                              <p className={`text-[9px] font-bold mt-0.5 ${coin.binanceChangeRate > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                {coin.binanceChangeRate > 0 ? "▲" : "▼"} {formatNumber(Math.abs(coin.binanceChangeRate), 2)}%
                              </p>
                            </td>
                            <td className="p-4 text-right">
                              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-black shadow-sm ${getPremiumColor(premium)}`}>
                                {premium > 0 ? "+" : ""}{formatNumber(premium, 2)}%
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <p className="font-black text-neutral-400 text-sm">{formatNumber(coin.upbitVolumeKrw / 1e8, 0)}<span className="text-[10px] ml-0.5 text-neutral-600">억</span></p>
                              <p className="text-[9px] font-bold text-neutral-600 uppercase mt-0.5 tracking-tighter">Approx. ${formatNumber(coin.binanceVolumeUsdt / 1e6, 1)}M</p>
                            </td>
                          </tr>
                          {expandedRow === coin.symbol && (
                            <tr>
                              <td colSpan={5} className="bg-neutral-950 p-6 border-b border-indigo-500/10 shadow-inner">
                                <div className="max-w-[1200px] mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                                  <Chart symbol={coin.symbol} binanceSymbol={coin.symbol + "USDT"} />
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
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Social & Execution (12/12) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Real-time Interaction Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col h-[500px] shadow-2xl overflow-hidden bg-opacity-60 backdrop-blur-md">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-black uppercase tracking-widest text-neutral-200 underline decoration-indigo-500 decoration-2 underline-offset-4">Tribe Live Feed</span>
              </div>
              <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full uppercase tracking-tighter">Verified Node</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800 hover:scrollbar-thumb-neutral-700">
              {chatParams.map((msg, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-neutral-500 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all">
                    {msg.sender.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-xs text-neutral-100">{msg.sender}</span>
                      <span className="text-[9px] text-neutral-600 font-mono italic">{new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed break-all selection:bg-indigo-500 selection:text-white">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <form onSubmit={sendChat} className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center gap-2">
              <input 
                type="text" 
                placeholder="시장 정황을 공유하세요..." 
                className="flex-1 bg-neutral-900/50 text-sm text-white outline-none px-4 py-2.5 rounded-xl border border-neutral-800 focus:border-indigo-500/50 transition-all font-medium"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:translate-y-[-1px] active:translate-y-0">SEND</button>
            </form>
          </div>

          {/* Binance Whale Watch / Liquidations */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex-1 overflow-hidden flex flex-col bg-opacity-60 backdrop-blur-md">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/60">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-sm">🔥</span>
                <span className="text-xs font-black uppercase tracking-widest text-neutral-200">Whale Liquidation Watch</span>
              </div>
              <span className="text-[10px] font-bold text-neutral-500 font-mono">Real-time Stream</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-neutral-800 hover:scrollbar-thumb-neutral-700">
              {liquidations.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-3">
                   <div className="w-8 h-8 border-2 border-neutral-800 border-t-rose-500/50 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Waiting for major liquidation events...</p>
                </div>
              ) : (
                liquidations.map((liq, i) => (
                  <div key={i} className="flex justify-between items-center bg-neutral-950/20 hover:bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-tighter ${liq.side === "SELL" ? "bg-rose-500/10 text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.1)]" : "bg-emerald-500/10 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.1)]"}`}>
                        {liq.side === "SELL" ? "LONG REKT" : "SHORT REKT"}
                      </div>
                      <div>
                        <p className="font-black text-xs text-white leading-tight">{liq.symbol}</p>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-tighter">{new Date(liq.time).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white mb-0.5">${formatNumber(liq.price * liq.qty, 0)}</p>
                      <p className="text-[9px] font-medium text-neutral-500 tracking-tight">Price: ${formatNumber(liq.price, 2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
