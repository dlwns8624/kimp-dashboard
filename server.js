const https = require("https");
const express = require("express");
const path = require("path");
const cors = require("cors");
const WebSocket = require("ws");

const COINS = [
  { symbol: "BTC", upbit: "KRW-BTC", bithumb: "BTC", binance: "BTCUSDT" },
  { symbol: "ETH", upbit: "KRW-ETH", bithumb: "ETH", binance: "ETHUSDT" },
  { symbol: "XRP", upbit: "KRW-XRP", bithumb: "XRP", binance: "XRPUSDT" },
  { symbol: "SOL", upbit: "KRW-SOL", bithumb: "SOL", binance: "SOLUSDT" },
  { symbol: "DOGE", upbit: "KRW-DOGE", bithumb: "DOGE", binance: "DOGEUSDT" },
  { symbol: "ADA", upbit: "KRW-ADA", bithumb: "ADA", binance: "ADAUSDT" },
  { symbol: "DOT", upbit: "KRW-DOT", bithumb: "DOT", binance: "DOTUSDT" },
  { symbol: "LINK", upbit: "KRW-LINK", bithumb: "LINK", binance: "LINKUSDT" },
  { symbol: "LTC", upbit: "KRW-LTC", bithumb: "LTC", binance: "LTCUSDT" },
  { symbol: "BCH", upbit: "KRW-BCH", bithumb: "BCH", binance: "BCHUSDT" },
  { symbol: "TRX", upbit: "KRW-TRX", bithumb: "TRX", binance: "TRXUSDT" }
];

const state = {
  fxRate: null,
  fxUpdatedAt: null,
  fearAndGreed: null,
  globalMetrics: null, // dominances, marketcap etc
  nasdaq: 18245.3,
  gold: 2154.2,
  coins: {},
  updatedAt: null,
  lastError: null
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 8
});

function fetchJson(url, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { timeout: timeoutMs, headers: { "User-Agent": "kimp-dashboard/0.1" } },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            console.error(`[fetchJson Error] ${url} -> HTTP ${res.statusCode}`);
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("Timeout"));
    });
  });
}

function computePremium(krwPrice, usdtPrice, fxRate) {
  if (!krwPrice || !usdtPrice || !fxRate) return null;
  const usdValue = usdtPrice * fxRate;
  if (!usdValue) return null;
  return ((krwPrice / usdValue) - 1) * 100;
}

async function updateFx() {
  const data = await fetchJson("https://open.er-api.com/v6/latest/USD");
  const rate = data && data.rates ? data.rates.KRW : null;
  if (rate) {
    state.fxRate = rate;
    state.fxUpdatedAt = new Date().toISOString();
  }
}

async function updateFearAndGreed() {
  try {
    const data = await fetchJson("https://api.alternative.me/fng/");
    if (data && data.data && data.data.length > 0) {
      state.fearAndGreed = {
        value: data.data[0].value,
        classification: data.data[0].value_classification,
        updatedAt: new Date().toISOString()
      };
      // broadcastState(); // Will broadcast together with updatePrices
    }
  } catch (err) {
    console.error("Failed to update Fear & Greed index:", err.message);
  }
}

async function updateGlobalMetrics() {
  try {
    const data = await fetchJson("https://api.coingecko.com/api/v3/global", 8000);
    if (data && data.data) {
      state.globalMetrics = {
        btcDominance: data.data.market_cap_percentage.btc,
        ethDominance: data.data.market_cap_percentage.eth,
        totalMarketCap: data.data.total_market_cap.usd,
        totalVolume: data.data.total_volume.usd,
        updatedAt: new Date().toISOString()
      };
    }
  } catch (err) {
    console.error("Failed to update Global Metrics:", err.message);
  }
}

async function updatePrices() {
  const upbitMarkets = COINS.map((coin) => coin.upbit).join(",");
  const binanceSymbols = JSON.stringify(COINS.map((coin) => coin.binance));
  
  const upbitUrl = `https://api.upbit.com/v1/ticker?markets=${upbitMarkets}`;
  const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(binanceSymbols)}`;
  const bithumbUrl = "https://api.bithumb.com/public/ticker/ALL_KRW";

  const [upbitData, binanceData, bithumbDataRes] = await Promise.all([
    fetchJson(upbitUrl).catch(() => null),
    fetchJson(binanceUrl).catch(() => null),
    fetchJson(bithumbUrl).catch(() => null)
  ]);

  const upbitMap = new Map();
  if (Array.isArray(upbitData)) {
    upbitData.forEach((item) => {
      upbitMap.set(item.market, item);
    });
  }

  const binanceMap = new Map();
  if (Array.isArray(binanceData)) {
    binanceData.forEach((item) => {
      binanceMap.set(item.symbol, item);
    });
  }
  
  const bithumbData = bithumbDataRes && bithumbDataRes.status === "0000" ? bithumbDataRes.data : {};
  console.log(`[Backend] Fetched Upbit: ${upbitMap.size}, Binance: ${binanceMap.size}, Bithumb: ${Object.keys(bithumbData).length}`);

  COINS.forEach((coin) => {
    const upbit = upbitMap.get(coin.upbit);
    const binance = binanceMap.get(coin.binance);
    const bithumb = bithumbData[coin.bithumb];
    
    if (!binance) {
        console.warn(`[Backend] Missing binance data for ${coin.symbol}`);
        return; 
    }

    // fallback to Bithumb if Upbit is missing
    let krwPrice = 0;
    let upbitChangeRate = 0;
    let upbitVolumeKrw = 0;
    
    if (upbit) {
        krwPrice = upbit.trade_price;
        upbitChangeRate = upbit.signed_change_rate;
        upbitVolumeKrw = upbit.acc_trade_price_24h;
    } else if (bithumb) {
        krwPrice = Number(bithumb.closing_price);
        upbitChangeRate = Number(bithumb.fluctate_rate_24H) / 100;
        upbitVolumeKrw = Number(bithumb.acc_trade_value_24H);
    } else {
        return; // neither
    }

    const usdtPrice = Number(binance.lastPrice);
    const premium = computePremium(krwPrice, usdtPrice, state.fxRate);
    
    let bithumbPrice = krwPrice;
    let bithumbPremium = premium;
    if (bithumb) {
        bithumbPrice = Number(bithumb.closing_price);
        bithumbPremium = computePremium(bithumbPrice, usdtPrice, state.fxRate);
    }

    state.coins[coin.symbol] = {
      symbol: coin.symbol,
      krwPrice,
      usdtPrice,
      premium,
      bithumbPrice,
      bithumbPremium,
      upbitChangeRate,
      upbitVolumeKrw,
      binanceChangeRate: Number(binance.priceChangePercent),
      binanceVolumeUsdt: Number(binance.quoteVolume),
      updatedAt: new Date().toISOString()
    };
  });
 
  console.log(`[Backend] State updated with ${Object.keys(state.coins).length} coins.`);
  state.updatedAt = new Date().toISOString();
  state.lastError = null;
  broadcastState();
}

let wss = null;
function broadcastState() {
  if (!wss) return;
  const message = JSON.stringify({ type: "UPDATE", state });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastEvent(type, payload) {
  if (!wss) return;
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Binance Futures Websocket for Liquidations
let binanceWs = null;
function startBinanceFuturesWebsocket() {
  binanceWs = new WebSocket("wss://fstream.binance.com/ws/!forceOrder@arr");
  binanceWs.on("message", (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.e === "forceOrder") {
        const order = parsed.o;
        broadcastEvent("LIQUIDATION", {
          symbol: order.s,
          side: order.S, // SELL (Long liq) or BUY (Short liq)
          price: parseFloat(order.p),
          qty: parseFloat(order.q),
          time: parsed.E
        });
      }
    } catch (e) {}
  });
  binanceWs.on("close", () => {
    setTimeout(startBinanceFuturesWebsocket, 3000);
  });
  binanceWs.on("error", () => {});
}

async function refreshData() {
  try {
    if (!state.fxRate || !state.fxUpdatedAt) {
      await updateFx();
    }
    await updatePrices();
  } catch (error) {
    state.lastError = error.message;
  }
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return numberFormatter.format(value);
}

function createServer() {
  const app = express();
  app.use(cors({
    origin: ["https://kimp-dashboard-iota.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }));


  app.get("/api/status", (_req, res) => {
    res.json({
      fxRate: state.fxRate,
      fxUpdatedAt: state.fxUpdatedAt,
      nasdaq: state.nasdaq,
      gold: state.gold,
      updatedAt: state.updatedAt,
      lastError: state.lastError
    });
  });

  app.get("/api/long-short", async (req, res) => {
    const symbol = req.query.symbol || "BTCUSDT";
    const period = req.query.period || "1h";
    try {
      const url = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=30`;
      const data = await fetchJson(url);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch long/short tracking data" });
    }
  });

  app.get("/api/long-short-stats", async (req, res) => {
    const symbol = req.query.symbol || "BTCUSDT";
    const period = req.query.period || "1h";
    try {
      const globalUrl = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`;
      const topUrl = `https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`;
      
      const [globalData, topData] = await Promise.all([
          fetchJson(globalUrl).catch(() => [{ longAccount: 0.5, shortAccount: 0.5 }]),
          fetchJson(topUrl).catch(() => [{ longAccount: 0.5, shortAccount: 0.5 }])
      ]);

      res.json({
          global: globalData[0] || { longAccount: 0.5, shortAccount: 0.5 },
          top: topData[0] || { longAccount: 0.5, shortAccount: 0.5 }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch long/short stats" });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 0;
      const url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";
      const data = await fetchJson(url, 5000).catch(err => {
          console.error("External News API failed:", err.message);
          return null;
      });
      if (data && Array.isArray(data.Data)) {
        // Return a slice based on page for demo
        const startIdx = page * 5;
        res.json(data.Data.slice(startIdx, startIdx + 10));
      } else {
        // Fallback
        const mockNews = [
          { id: "f1", title: "Bitcoin Consolidation Continues Near $74k", body: "Market analysts suggest a period of price discovery as BTC holds steady.", source: "CryptoCompare (Mock)", published_on: Math.floor(Date.now()/1000 - 3600), url: "https://kimp.co.kr" },
          { id: "f2", title: "Global Regulatory Shifts for Stablecoins", body: "New standard guidelines are being discussed by G7 finance ministers.", source: "KIMP News", published_on: Math.floor(Date.now()/1000 - 7200), url: "https://kimp.co.kr" },
          { id: "f3", title: "Ethereum Layer 2 Adoption Spikes", body: "Transaction counts on key L2 networks reach all-time highs as fees drop.", source: "KIMP News", published_on: Math.floor(Date.now()/1000 - 10800), url: "https://kimp.co.kr" }
        ];
        res.json(mockNews);
      }
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/calendar", (req, res) => {
    const CALENDAR_EVENTS = [
      { id: 1, date: "2026-03-18", time: "22:30", name: "미국 근원 소매판매 (MoM)", importance: "높음", actual: "0.2%", forecast: "0.4%", previous: "0.5%" },
      { id: 2, date: "2026-03-18", time: "22:30", name: "미국 생산자물가지수 (PPI)", importance: "높음", actual: "-", forecast: "0.3%", previous: "0.3%" },
      { id: 3, date: "2026-03-19", time: "03:00", name: "FOMC 금리 결정", importance: "높음", actual: "-", forecast: "5.25%", previous: "5.50%" },
      { id: 4, date: "2026-03-19", time: "03:30", name: "연준(Fed) 파월 의장 기자회견", importance: "높음", actual: "-", forecast: "-", previous: "-" },
      { id: 5, date: "2026-03-20", time: "18:00", name: "유로존 소비자물가지수 (CPI) 발표", importance: "보통", actual: "-", forecast: "2.8%", previous: "2.8%" },
      { id: 6, date: "2026-03-21", time: "21:30", name: "미국 신규 실업수당청구건수", importance: "낮음", actual: "-", forecast: "212K", previous: "209K" },
      { id: 7, date: "2026-03-22", time: "10:00", name: "중구 LPR 금리 결정", importance: "보통", actual: "-", forecast: "3.45%", previous: "3.45%" },
      { id: 8, date: "2026-03-23", time: "17:30", name: "독일 제조업 PMI", importance: "보통", actual: "-", forecast: "42.5", previous: "42.2" }
    ];
    res.json(CALENDAR_EVENTS);
  });

  app.get("/api/coins", (_req, res) => {
    const rows = COINS.map((coin) => {
      const data = state.coins[coin.symbol] || null;
      if (!data) return { symbol: coin.symbol, available: false };
      return {
        symbol: data.symbol,
        krwPrice: data.krwPrice,
        usdtPrice: data.usdtPrice,
        premium: data.premium,
        upbitChangeRate: data.upbitChangeRate,
        upbitVolumeKrw: data.upbitVolumeKrw,
        binanceChangeRate: data.binanceChangeRate,
        binanceVolumeUsdt: data.binanceVolumeUsdt,
        updatedAt: data.updatedAt
      };
    });
    res.json({ rows });
  });

  app.get("/api/pretty", (_req, res) => {
    const rows = COINS.map((coin) => {
      const data = state.coins[coin.symbol];
      if (!data) return { symbol: coin.symbol, available: false };
      return {
        symbol: data.symbol,
        krwPrice: formatNumber(data.krwPrice),
        usdtPrice: formatNumber(data.usdtPrice),
        premium: formatNumber(data.premium),
        upbitChangeRate: formatNumber(data.upbitChangeRate * 100),
        upbitVolumeKrw: formatNumber(data.upbitVolumeKrw),
        binanceChangeRate: formatNumber(data.binanceChangeRate),
        binanceVolumeUsdt: formatNumber(data.binanceVolumeUsdt),
        updatedAt: data.updatedAt
      };
    });
    res.json({
      fxRate: formatNumber(state.fxRate),
      fxUpdatedAt: state.fxUpdatedAt,
      updatedAt: state.updatedAt,
      rows
    });
  });

  const start = (port = 3000) =>
    new Promise((resolve) => {
      const server = app.listen(port, "0.0.0.0", () => {
        console.log(`[Backend] Server listening on port ${port}`);
        wss = new WebSocket.Server({ server });
        wss.on("connection", (ws, req) => {
          console.log(`[Backend] WebSocket connected from ${req.socket.remoteAddress}`);
          ws.send(JSON.stringify({ type: "INIT", state }));
          
          ws.on("message", (msg) => {
              try {
                  const data = JSON.parse(msg);
                  if (data.type === "CHAT_MSG") {
                      broadcastEvent("CHAT", {
                          sender: data.sender || "유저",
                          text: data.text,
                          time: Date.now()
                      });
                  }
              } catch(e) {}
          });
        });
        resolve(server);
      });
    });

  return { app, start };
}

if (require.main === module) {
  const { start } = createServer();
  refreshData();
  updateFearAndGreed();
  updateGlobalMetrics();
  startBinanceFuturesWebsocket();
  
  setInterval(refreshData, 5000);
  setInterval(updateFx, 60000);
  setInterval(updateFearAndGreed, 300000); // 5 minutes
  setInterval(updateGlobalMetrics, 300000); // 5 mins
  
  start(process.env.PORT ? Number(process.env.PORT) : 3000);
}

module.exports = { createServer, refreshData, state };
