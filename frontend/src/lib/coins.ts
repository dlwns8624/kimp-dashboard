export type CoinDef = {
  symbol: string;
  upbit: string;
  bithumb: string;
  binance: string;
};

export const COINS: CoinDef[] = [
  // Major
  { symbol: "BTC",   upbit: "KRW-BTC",   bithumb: "BTC",   binance: "BTCUSDT"   },
  { symbol: "ETH",   upbit: "KRW-ETH",   bithumb: "ETH",   binance: "ETHUSDT"   },
  { symbol: "SOL",   upbit: "KRW-SOL",   bithumb: "SOL",   binance: "SOLUSDT"   },
  { symbol: "XRP",   upbit: "KRW-XRP",   bithumb: "XRP",   binance: "XRPUSDT"   },
  { symbol: "DOGE",  upbit: "KRW-DOGE",  bithumb: "DOGE",  binance: "DOGEUSDT"  },
  // L1/L2
  { symbol: "ADA",   upbit: "KRW-ADA",   bithumb: "ADA",   binance: "ADAUSDT"   },
  { symbol: "AVAX",  upbit: "KRW-AVAX",  bithumb: "AVAX",  binance: "AVAXUSDT"  },
  { symbol: "DOT",   upbit: "KRW-DOT",   bithumb: "DOT",   binance: "DOTUSDT"   },
  { symbol: "LINK",  upbit: "KRW-LINK",  bithumb: "LINK",  binance: "LINKUSDT"  },
  { symbol: "MATIC", upbit: "KRW-MATIC", bithumb: "MATIC", binance: "MATICUSDT" },
  { symbol: "NEAR",  upbit: "KRW-NEAR",  bithumb: "NEAR",  binance: "NEARUSDT"  },
  { symbol: "SUI",   upbit: "KRW-SUI",   bithumb: "SUI",   binance: "SUIUSDT"   },
  { symbol: "APT",   upbit: "KRW-APT",   bithumb: "APT",   binance: "APTUSDT"   },
  { symbol: "ARB",   upbit: "KRW-ARB",   bithumb: "ARB",   binance: "ARBUSDT"   },
  { symbol: "OP",    upbit: "KRW-OP",    bithumb: "OP",    binance: "OPUSDT"    },
  // Alts
  { symbol: "LTC",   upbit: "KRW-LTC",   bithumb: "LTC",   binance: "LTCUSDT"   },
  { symbol: "BCH",   upbit: "KRW-BCH",   bithumb: "BCH",   binance: "BCHUSDT"   },
  { symbol: "TRX",   upbit: "KRW-TRX",   bithumb: "TRX",   binance: "TRXUSDT"   },
  { symbol: "SHIB",  upbit: "KRW-SHIB",  bithumb: "SHIB",  binance: "SHIBUSDT"  },
  { symbol: "ETC",   upbit: "KRW-ETC",   bithumb: "ETC",   binance: "ETCUSDT"   },
  { symbol: "ATOM",  upbit: "KRW-ATOM",  bithumb: "ATOM",  binance: "ATOMUSDT"  },
  { symbol: "STX",   upbit: "KRW-STX",   bithumb: "STX",   binance: "STXUSDT"   },
  { symbol: "FIL",   upbit: "KRW-FIL",   bithumb: "FIL",   binance: "FILUSDT"   },
  { symbol: "IMX",   upbit: "KRW-IMX",   bithumb: "IMX",   binance: "IMXUSDT"   },
  { symbol: "ALGO",  upbit: "KRW-ALGO",  bithumb: "ALGO",  binance: "ALGOUSDT"  },
  // Ecosystem
  { symbol: "HBAR",  upbit: "KRW-HBAR",  bithumb: "HBAR",  binance: "HBARUSDT"  },
  { symbol: "ICP",   upbit: "KRW-ICP",   bithumb: "ICP",   binance: "ICPUSDT"   },
  { symbol: "GRT",   upbit: "KRW-GRT",   bithumb: "GRT",   binance: "GRTUSDT"   },
  { symbol: "VET",   upbit: "KRW-VET",   bithumb: "VET",   binance: "VETUSDT"   },
  { symbol: "SEI",   upbit: "KRW-SEI",   bithumb: "SEI",   binance: "SEIUSDT"   },
  { symbol: "THETA", upbit: "KRW-THETA", bithumb: "THETA", binance: "THETAUSDT" },
  { symbol: "EGLD",  upbit: "KRW-EGLD",  bithumb: "EGLD",  binance: "EGLDUSDT"  },
  { symbol: "SAND",  upbit: "KRW-SAND",  bithumb: "SAND",  binance: "SANDUSDT"  },
  { symbol: "MANA",  upbit: "KRW-MANA",  bithumb: "MANA",  binance: "MANAUSDT"  },
  { symbol: "GALA",  upbit: "KRW-GALA",  bithumb: "GALA",  binance: "GALAUSDT"  },
  // DeFi
  { symbol: "AAVE",  upbit: "KRW-AAVE",  bithumb: "AAVE",  binance: "AAVEUSDT"  },
  { symbol: "MKR",   upbit: "KRW-MKR",   bithumb: "MKR",   binance: "MKRUSDT"   },
  { symbol: "SNX",   upbit: "KRW-SNX",   bithumb: "SNX",   binance: "SNXUSDT"   },
  { symbol: "CRV",   upbit: "KRW-CRV",   bithumb: "CRV",   binance: "CRVUSDT"   },
  { symbol: "UNI",   upbit: "KRW-UNI",   bithumb: "UNI",   binance: "UNIUSDT"   },
  // Trending
  { symbol: "BLUR",  upbit: "KRW-BLUR",  bithumb: "BLUR",  binance: "BLURUSDT"  },
  { symbol: "BONK",  upbit: "KRW-BONK",  bithumb: "BONK",  binance: "BONKUSDT"  },
  { symbol: "PEPE",  upbit: "KRW-PEPE",  bithumb: "PEPE",  binance: "PEPEUSDT"  },
  { symbol: "WLD",   upbit: "KRW-WLD",   bithumb: "WLD",   binance: "WLDUSDT"   },
  { symbol: "TIA",   upbit: "KRW-TIA",   bithumb: "TIA",   binance: "TIAUSDT"   },
  { symbol: "ORDI",  upbit: "KRW-ORDI",  bithumb: "ORDI",  binance: "ORDIUSDT"  },
  { symbol: "MINA",  upbit: "KRW-MINA",  bithumb: "MINA",  binance: "MINAUSDT"  },
  { symbol: "ASTR",  upbit: "KRW-ASTR",  bithumb: "ASTR",  binance: "ASTRUSDT"  },
  { symbol: "GLM",   upbit: "KRW-GLM",   bithumb: "GLM",   binance: "GLMUSDT"   },
  { symbol: "JUP",   upbit: "KRW-JUP",   bithumb: "JUP",   binance: "JUPUSDT"   },
  // Others
  { symbol: "MASK",  upbit: "KRW-MASK",  bithumb: "MASK",  binance: "MASKUSDT"  },
  { symbol: "FLOW",  upbit: "KRW-FLOW",  bithumb: "FLOW",  binance: "FLOWUSDT"  },
  { symbol: "ANKR",  upbit: "KRW-ANKR",  bithumb: "ANKR",  binance: "ANKRUSDT"  },
  { symbol: "CHZ",   upbit: "KRW-CHZ",   bithumb: "CHZ",   binance: "CHZUSDT"   },
  { symbol: "BAT",   upbit: "KRW-BAT",   bithumb: "BAT",   binance: "BATUSDT"   },
  { symbol: "ZIL",   upbit: "KRW-ZIL",   bithumb: "ZIL",   binance: "ZILUSDT"   },
  { symbol: "QTUM",  upbit: "KRW-QTUM",  bithumb: "QTUM",  binance: "QTUMUSDT"  },
  { symbol: "KAVA",  upbit: "KRW-KAVA",  bithumb: "KAVA",  binance: "KAVAUSDT"  },
  { symbol: "ZRX",   upbit: "KRW-ZRX",   bithumb: "ZRX",   binance: "ZRXUSDT"   },
];
