"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { COINS } from "@/lib/coins";

// ─── Types ──────────────────────────────────────────────────────────────────
export type CoinData = {
  symbol: string;
  upbitSymbol: string;
  binanceSymbol: string;
  // TradingView 기준가 (Binance USD × FX)
  binanceUsdPrice: number;
  binanceKrwEquiv: number;
  // 업비트
  krwPrice: number;
  upbitChangeRate: number;
  upbitVolumeKrw: number;
  // 빗썸
  bithumbPrice: number;
  // 김프 (업/빗 vs 바이낸스)
  premium: number;
  bithumbPremium: number;
  // 바이낸스
  binanceChangeRate: number;
  binanceVolumeUsdt: number;
  // 시가총액 (CryptoCompare)
  marketCap: number;
  updatedAt: string;
};

export type GlobalMetrics = {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  totalVolume: number;
};

export type FearAndGreed = {
  value: string;
  classification: string;
};

export type MarketState = {
  coins: Record<string, CoinData>;
  fxRate: number;
  globalMetrics: GlobalMetrics | null;
  fearAndGreed: FearAndGreed | null;
  nasdaq: number | null;
  gold: number | null;
  updatedAt: string | null;
  isLive: boolean;
};

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useMarketData(): MarketState {
  const [coins, setCoins]               = useState<Record<string, CoinData>>({});
  const [fxRate, setFxRate]             = useState<number>(1400);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  const [fearAndGreed, setFearAndGreed] = useState<FearAndGreed | null>(null);
  const [nasdaq, setNasdaq]             = useState<number | null>(null);
  const [gold, setGold]                 = useState<number | null>(null);
  const [updatedAt, setUpdatedAt]       = useState<string | null>(null);

  const fxRateRef    = useRef<number>(1400);
  const marketCapRef = useRef<Record<string, number>>({});

  useEffect(() => { fxRateRef.current = fxRate; }, [fxRate]);

  // ── FX Rate ────────────────────────────────────────────────────────────
  const fetchFxRate = useCallback(async () => {
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
      const d = await r.json();
      if (d?.rates?.KRW) {
        fxRateRef.current = d.rates.KRW;
        setFxRate(d.rates.KRW);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Market Cap (CryptoCompare — symbol-based, no ID mapping needed) ────
  const fetchMarketCap = useCallback(async () => {
    try {
      const fsyms = COINS.map(c => c.symbol).join(",");
      const r = await fetch(
        `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsyms}&tsyms=USD`,
        { cache: "no-store" }
      );
      const d = await r.json();
      if (d?.RAW) {
        const mc: Record<string, number> = {};
        Object.keys(d.RAW).forEach(sym => {
          mc[sym] = d.RAW[sym]?.USD?.MKTCAP ?? 0;
        });
        marketCapRef.current = mc;
      }
    } catch { /* ignore */ }
  }, []);

  // ── NASDAQ / Gold (backend 또는 대체 소스) ────────────────────────────
  const fetchMacroData = useCallback(async () => {
    try {
      // 백엔드 /api/status 에서 nasdaq + gold (Yahoo Finance 서버사이드)
      const r = await fetch("https://kimp-backend-2sww.onrender.com/api/status", {
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      const d = await r.json();
      if (d?.nasdaq) setNasdaq(d.nasdaq);
      if (d?.gold)   setGold(d.gold);
    } catch {
      // 백엔드 슬립 중 → metals.live에서 금 가격만 가져옴
      try {
        const r = await fetch("https://api.metals.live/v1/spot/gold", { cache: "no-store" });
        const d = await r.json();
        const goldVal = d?.[0]?.gold ?? d?.gold ?? null;
        if (goldVal) setGold(Number(goldVal));
      } catch { /* ignore */ }
    }
  }, []);

  // ── Global Metrics (CoinGecko) ─────────────────────────────────────────
  const fetchGlobalMetrics = useCallback(async () => {
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" });
      const d = await r.json();
      if (d?.data) {
        setGlobalMetrics({
          btcDominance:   d.data.market_cap_percentage?.btc ?? 0,
          ethDominance:   d.data.market_cap_percentage?.eth ?? 0,
          totalMarketCap: d.data.total_market_cap?.usd ?? 0,
          totalVolume:    d.data.total_volume?.usd ?? 0,
        });
      }
    } catch { /* ignore */ }
  }, []);

  // ── Fear & Greed ───────────────────────────────────────────────────────
  const fetchFearAndGreed = useCallback(async () => {
    try {
      const r = await fetch("https://api.alternative.me/fng/", { cache: "no-store" });
      const d = await r.json();
      if (d?.data?.[0]) {
        setFearAndGreed({
          value: d.data[0].value,
          classification: d.data[0].value_classification,
        });
      }
    } catch { /* ignore */ }
  }, []);

  // ── Prices: Binance + Upbit + Bithumb ─────────────────────────────────
  const fetchPrices = useCallback(async () => {
    const fx = fxRateRef.current;
    try {
      const upbitMarkets    = COINS.map(c => c.upbit).join(",");
      const binanceSymbols  = JSON.stringify(COINS.map(c => c.binance));

      const [upbitRaw, binanceRaw, bithumbRaw] = await Promise.all([
        fetch(`https://api.upbit.com/v1/ticker?markets=${upbitMarkets}`, { cache: "no-store" })
          .then(r => r.json()).catch(() => null),
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(binanceSymbols)}`, { cache: "no-store" })
          .then(r => r.json()).catch(() => null),
        fetch("https://api.bithumb.com/public/ticker/ALL_KRW", { cache: "no-store" })
          .then(r => r.json()).catch(() => null),
      ]);

      // Build lookup maps
      const upbitMap = new Map<string, Record<string, number>>();
      if (Array.isArray(upbitRaw)) {
        upbitRaw.forEach((item: Record<string, number | string>) => upbitMap.set(item.market as string, item as Record<string, number>));
      }

      const binanceMap = new Map<string, Record<string, string>>();
      if (Array.isArray(binanceRaw)) {
        binanceRaw.forEach((item: Record<string, string>) => binanceMap.set(item.symbol, item));
      }

      const bithumbData: Record<string, Record<string, string>> =
        bithumbRaw?.status === "0000" ? bithumbRaw.data : {};

      const next: Record<string, CoinData> = {};

      COINS.forEach(coin => {
        const upbit   = upbitMap.get(coin.upbit);
        const binance = binanceMap.get(coin.binance);
        const bithumb = bithumbData[coin.bithumb];

        if (!upbit && !bithumb) return; // 상장 안 된 코인은 제외

        // ── 업비트 ──
        const krwPrice        = upbit ? Number(upbit.trade_price) : Number(bithumb?.closing_price ?? 0);
        const upbitChangeRate = upbit ? Number(upbit.signed_change_rate) : Number(bithumb?.fluctate_rate_24H ?? 0) / 100;
        const upbitVolumeKrw  = upbit ? Number(upbit.acc_trade_price_24h) : Number(bithumb?.acc_trade_value_24H ?? 0);

        // ── 바이낸스 (트레이딩뷰 기준가) ──
        const binanceUsdPrice  = binance ? Number(binance.lastPrice) : krwPrice / fx;
        const binanceKrwEquiv  = binanceUsdPrice * fx; // 트레이딩뷰 기준 KRW 환산가

        // ── 김프: (업비트KRW - 바이낸스KRW환산) / 바이낸스KRW환산 * 100 ──
        const premium = binanceKrwEquiv > 0 ? ((krwPrice / binanceKrwEquiv) - 1) * 100 : 0;

        // ── 빗썸 ──
        const bithumbPrice   = bithumb ? Number(bithumb.closing_price) : krwPrice;
        const bithumbPremium = bithumb && binanceKrwEquiv > 0
          ? ((bithumbPrice / binanceKrwEquiv) - 1) * 100
          : premium;

        next[coin.symbol] = {
          symbol:            coin.symbol,
          upbitSymbol:       coin.upbit,
          binanceSymbol:     coin.binance,
          binanceUsdPrice,
          binanceKrwEquiv,
          krwPrice,
          upbitChangeRate,
          upbitVolumeKrw,
          bithumbPrice,
          premium,
          bithumbPremium,
          binanceChangeRate: binance ? Number(binance.priceChangePercent) : 0,
          binanceVolumeUsdt: binance ? Number(binance.quoteVolume) : 0,
          marketCap:         marketCapRef.current[coin.symbol] ?? 0,
          updatedAt:         new Date().toISOString(),
        };
      });

      setCoins(next);
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error("[useMarketData] fetchPrices failed:", err);
    }
  }, []);

  // ── Effect: setup intervals ────────────────────────────────────────────
  useEffect(() => {
    // Initial load sequence
    const init = async () => {
      await fetchFxRate();
      await Promise.all([fetchMarketCap(), fetchGlobalMetrics(), fetchFearAndGreed()]);
      await fetchPrices();
      fetchMacroData(); // 백그라운드 - 느려도 괜찮음
    };
    init();

    const T_PRICE  = setInterval(fetchPrices,        5_000);   // 5s
    const T_MCAP   = setInterval(fetchMarketCap,    60_000);   // 1min
    const T_MACRO  = setInterval(fetchMacroData,   120_000);   // 2min
    const T_FX     = setInterval(fetchFxRate,      300_000);   // 5min
    const T_GLOBAL = setInterval(fetchGlobalMetrics, 300_000); // 5min
    const T_FNG    = setInterval(fetchFearAndGreed,  600_000); // 10min

    return () => {
      clearInterval(T_PRICE);
      clearInterval(T_MCAP);
      clearInterval(T_MACRO);
      clearInterval(T_FX);
      clearInterval(T_GLOBAL);
      clearInterval(T_FNG);
    };
  }, [fetchFxRate, fetchMarketCap, fetchGlobalMetrics, fetchFearAndGreed, fetchPrices, fetchMacroData]);

  return {
    coins,
    fxRate,
    globalMetrics,
    fearAndGreed,
    nasdaq,
    gold,
    updatedAt,
    isLive: Object.keys(coins).length > 0,
  };
}
