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

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "INIT" || message.type === "UPDATE") {
            setData(message.state);
            checkNotifications(message.state.coins);
          } else if (message.type === "CHAT") {
            setChatParams(prev => [...prev.slice(-49), message.payload]);
          } else if (message.type === "LIQUIDATION") {
            setLiquidations(prev => [message.payload, ...prev.slice(0, 19)]); // Keep last 20
          }
        } catch (error) {
          console.error("Failed to parse websocket message", error);
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

  const formatNumber = (num: number | null | undefined, maxFrac = 2) => {
    if (num === null || num === undefined) return "-";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(num);
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
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Overviews & Global Metrics */}
        <div className="lg:col-span-2 space-y-4 hidden lg:block">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg h-full">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6 border-b border-neutral-800 pb-2">Market Overview</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Global Total Market Cap</p>
                <p className="text-lg font-bold text-neutral-100">${formatNumber((data?.globalMetrics?.totalMarketCap || 0) / 1e9, 2)}B</p>
              </div>
              
              <div>
                <p className="text-xs text-neutral-500 mb-1">24h Global Volume</p>
                <p className="text-lg font-bold text-neutral-100">${formatNumber((data?.globalMetrics?.totalVolume || 0) / 1e9, 2)}B</p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-1">BTC Dominance</p>
                <p className="text-lg font-bold text-indigo-400">{formatNumber(data?.globalMetrics?.btcDominance, 2)}%</p>
                <div className="w-full bg-neutral-800 rounded-full h-1 mt-2">
                  <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${data?.globalMetrics?.btcDominance || 0}%` }}></div>
                </div>
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-1">Fear & Greed Index</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${Number(data?.fearAndGreed?.value) > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data?.fearAndGreed ? data.fearAndGreed.value : "-"}
                  </p>
                  <p className="text-xs text-neutral-400">{data?.fearAndGreed ? data.fearAndGreed.classification : ""}</p>
                </div>
              </div>

              {/* Alert Settings inside Left Col */}
              <div className="pt-6 border-t border-neutral-800 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Alert System</p>
                  <button onClick={setupNotifications} className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${notiEnabled ? 'bg-indigo-500' : 'bg-neutral-700'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notiEnabled ? 'translate-x-4' : 'translate-x-0'}`}></span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Target &gt;</span>
                  <input type="number" value={notiTargetKimp} onChange={(e) => setNotiTargetKimp(Number(e.target.value))} className="w-16 bg-neutral-800 text-white rounded px-2 py-1 text-sm outline-none" disabled={!notiEnabled}/>
                  <span className="text-sm font-medium">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Main Dashboard & Table */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Widgets Bar */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase">BTC Premium</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data?.coins["BTC"] ? formatNumber(exchange === "upbit" ? data.coins["BTC"].premium : data.coins["BTC"].bithumbPremium, 2) : "-"}%
                </p>
              </div>
              <div className="text-indigo-400/20 text-4xl">₿</div>
            </div>
            
            <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase">USD/KRW Rate</p>
                <p className="text-2xl font-bold text-white mt-1">₩{data?.fxRate ? formatNumber(data.fxRate) : "-"}</p>
              </div>
              <div className="text-emerald-400/20 text-4xl">$</div>
            </div>

            <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg flex items-center justify-between hidden sm:flex">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase">NASDAQ 100</p>
                <p className="text-2xl font-bold text-white mt-1">{data?.nasdaq ? formatNumber(data.nasdaq) : "-"}</p>
              </div>
              <div className="text-sky-400/20 text-4xl">N</div>
            </div>

            <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg flex items-center justify-between hidden md:flex">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase">Gold (XAU/USD)</p>
                <p className="text-2xl font-bold text-white mt-1">${data?.gold ? formatNumber(data.gold) : "-"}</p>
              </div>
              <div className="text-yellow-400/20 text-4xl">G</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-neutral-900/80">
              <div className="flex flex-wrap gap-4 items-center">
                <select 
                  className="bg-neutral-800 text-sm text-white px-3 py-1.5 rounded-lg border border-neutral-700 outline-none"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value as Exchange)}
                >
                  <option value="upbit">국내 거래소: UPBIT</option>
                  <option value="bithumb">국내 거래소: BITHUMB</option>
                </select>
                <span className="text-neutral-500 text-sm">↔</span>
                <span className="bg-neutral-800/50 text-sm text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700">해외: Binance (USDT)</span>
              </div>
              <div className="relative w-full md:w-64">
                <input 
                  type="text" 
                  placeholder="Asset Search..." 
                  className="w-full bg-neutral-800 text-sm text-white pl-10 pr-4 py-1.5 rounded-lg border border-neutral-700 outline-none focus:border-indigo-500 transition-all font-bold placeholder:font-normal"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  🔍
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-neutral-950/80">
                    <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800 cursor-pointer" onClick={() => handleSort("symbol")}>
                      Asset {sortKey === "symbol" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800 text-right cursor-pointer" onClick={() => handleSort("price")}>
                      Price ({exchange.toUpperCase()}) {sortKey === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800 text-right cursor-pointer" onClick={() => handleSort("premium")}>
                      Premium (Kimp) {sortKey === "premium" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800 text-right hidden sm:table-cell cursor-pointer" onClick={() => handleSort("volume")}>
                      24h Vol (KRW) {sortKey === "volume" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {sortedCoins.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-20 text-center text-neutral-500">
                           {data ? "암호화폐 데이터를 불러오고 있습니다..." : "서버에 연결 중입니다..."}
                        </td>
                    </tr>
                  ) : sortedCoins.map((coin) => {
                    const price = exchange === "upbit" ? coin.krwPrice : coin.bithumbPrice;
                    const premium = exchange === "upbit" ? coin.premium : coin.bithumbPremium;
                    return (
                      <React.Fragment key={coin.symbol}>
                        <tr className="hover:bg-neutral-800/40 cursor-pointer group" onClick={() => setExpandedRow(expandedRow === coin.symbol ? null : coin.symbol)}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 text-xs">{coin.symbol.charAt(0)}</div>
                              <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">{coin.symbol}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <p className="font-bold text-white">₩{formatNumber(price, 0)}</p>
                            <p className={`text-xs ${coin.upbitChangeRate > 0 ? "text-rose-400" : "text-blue-400"}`}>
                              {coin.upbitChangeRate > 0 ? "▲" : "▼"} {formatNumber(coin.upbitChangeRate * 100)}%
                            </p>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPremiumColor(premium)}`}>
                              {premium > 0 ? "+" : ""}{formatNumber(premium, 2)}%
                            </span>
                          </td>
                          <td className="p-4 text-right hidden sm:table-cell text-sm text-neutral-400">
                            {formatNumber(coin.upbitVolumeKrw / 10e7, 0)}억
                          </td>
                        </tr>
                        {expandedRow === coin.symbol && (
                          <tr>
                            <td colSpan={4} className="bg-neutral-950 p-4 border-b border-neutral-800/80">
                              <Chart symbol={coin.symbol} binanceSymbol={coin.symbol + "USDT"} />
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

        {/* RIGHT COLUMN: Chat & Liquidations */}
        <div className="lg:col-span-3 space-y-4 flex flex-col h-full">
          {/* Chat Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col h-[500px] lg:h-1/2 shadow-lg">
            <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80 rounded-t-2xl">
              <span className="text-sm font-bold text-neutral-300">Live Chat</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">Global</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-700">
              {chatParams.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-xs text-neutral-500 font-mono mr-2">{new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="font-bold text-indigo-300 mr-2">{msg.sender}</span>
                  <span className="text-neutral-200">{msg.text}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <form onSubmit={sendChat} className="p-3 border-t border-neutral-800 bg-neutral-950/50 flex rounded-b-2xl">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 bg-transparent text-sm text-white outline-none px-2"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit" className="text-indigo-400 text-sm font-bold px-3 hover:text-indigo-300 transition-colors">Send</button>
            </form>
          </div>

          {/* Liquidation Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg flex-1 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80">
              <span className="text-sm font-bold text-neutral-300">Liquidations (Binance)</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-700">
              {liquidations.length === 0 ? (
                <div className="text-center text-xs text-neutral-500 mt-10">Waiting for events...</div>
              ) : (
                liquidations.map((liq, i) => (
                  <div key={i} className="flex justify-between items-center bg-neutral-950/50 p-2 mb-2 rounded border border-neutral-800/50 text-xs">
                    <div>
                      <span className={`font-bold mr-2 ${liq.side === "SELL" ? "text-rose-400" : "text-emerald-400"}`}>
                        {liq.symbol} {liq.side === "SELL" ? "Long Liq" : "Short Liq"}
                      </span>
                      <span className="text-neutral-500">{new Date(liq.time).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-white">${formatNumber(liq.price * liq.qty, 0)}</p>
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
