// ── NSE Equity Symbols ────────────────────────────────────────────────────────
// id: NSE ticker, yahoo: Yahoo Finance symbol (.NS), tv: TradingView symbol
export const SYMBOLS = [
  // NIFTY 50 Large Caps
  { label: 'RELIANCE',    id: 'RELIANCE',    yahoo: 'RELIANCE.NS',    tv: 'NSE:RELIANCE',    sector: 'Energy'     },
  { label: 'TCS',         id: 'TCS',         yahoo: 'TCS.NS',         tv: 'NSE:TCS',         sector: 'IT'         },
  { label: 'INFY',        id: 'INFY',        yahoo: 'INFY.NS',        tv: 'NSE:INFY',        sector: 'IT'         },
  { label: 'HDFCBANK',    id: 'HDFCBANK',    yahoo: 'HDFCBANK.NS',    tv: 'NSE:HDFCBANK',    sector: 'Banking'    },
  { label: 'ICICIBANK',   id: 'ICICIBANK',   yahoo: 'ICICIBANK.NS',   tv: 'NSE:ICICIBANK',   sector: 'Banking'    },
  { label: 'HINDUNILVR',  id: 'HINDUNILVR',  yahoo: 'HINDUNILVR.NS',  tv: 'NSE:HINDUNILVR',  sector: 'FMCG'       },
  { label: 'WIPRO',       id: 'WIPRO',       yahoo: 'WIPRO.NS',       tv: 'NSE:WIPRO',       sector: 'IT'         },
  { label: 'BAJFINANCE',  id: 'BAJFINANCE',  yahoo: 'BAJFINANCE.NS',  tv: 'NSE:BAJFINANCE',  sector: 'Finance'    },
  { label: 'SBIN',        id: 'SBIN',        yahoo: 'SBIN.NS',        tv: 'NSE:SBIN',        sector: 'Banking'    },
  { label: 'AXISBANK',    id: 'AXISBANK',    yahoo: 'AXISBANK.NS',    tv: 'NSE:AXISBANK',    sector: 'Banking'    },
  { label: 'LT',          id: 'LT',          yahoo: 'LT.NS',          tv: 'NSE:LT',          sector: 'Infra'      },
  { label: 'KOTAKBANK',   id: 'KOTAKBANK',   yahoo: 'KOTAKBANK.NS',   tv: 'NSE:KOTAKBANK',   sector: 'Banking'    },
  { label: 'ITC',         id: 'ITC',         yahoo: 'ITC.NS',         tv: 'NSE:ITC',         sector: 'FMCG'       },
  { label: 'TITAN',       id: 'TITAN',       yahoo: 'TITAN.NS',       tv: 'NSE:TITAN',       sector: 'Consumer'   },
  { label: 'SUNPHARMA',   id: 'SUNPHARMA',   yahoo: 'SUNPHARMA.NS',   tv: 'NSE:SUNPHARMA',   sector: 'Pharma'     },
  { label: 'TATAMOTORS',  id: 'TATAMOTORS',  yahoo: 'TATAMOTORS.NS',  tv: 'NSE:TATAMOTORS',  sector: 'Auto'       },
  { label: 'TATASTEEL',   id: 'TATASTEEL',   yahoo: 'TATASTEEL.NS',   tv: 'NSE:TATASTEEL',   sector: 'Metal'      },
  { label: 'ADANIPORTS',  id: 'ADANIPORTS',  yahoo: 'ADANIPORTS.NS',  tv: 'NSE:ADANIPORTS',  sector: 'Infra'      },
  { label: 'POWERGRID',   id: 'POWERGRID',   yahoo: 'POWERGRID.NS',   tv: 'NSE:POWERGRID',   sector: 'Power'      },
  { label: 'NTPC',        id: 'NTPC',        yahoo: 'NTPC.NS',        tv: 'NSE:NTPC',        sector: 'Power'      },
  { label: 'MARUTI',      id: 'MARUTI',      yahoo: 'MARUTI.NS',      tv: 'NSE:MARUTI',      sector: 'Auto'       },
  { label: 'BHARTIARTL',  id: 'BHARTIARTL',  yahoo: 'BHARTIARTL.NS',  tv: 'NSE:BHARTIARTL',  sector: 'Telecom'    },
  { label: 'NESTLEIND',   id: 'NESTLEIND',   yahoo: 'NESTLEIND.NS',   tv: 'NSE:NESTLEIND',   sector: 'FMCG'       },
  { label: 'DRREDDY',     id: 'DRREDDY',     yahoo: 'DRREDDY.NS',     tv: 'NSE:DRREDDY',     sector: 'Pharma'     },
  { label: 'CIPLA',       id: 'CIPLA',       yahoo: 'CIPLA.NS',       tv: 'NSE:CIPLA',       sector: 'Pharma'     },
  { label: 'HCLTECH',     id: 'HCLTECH',     yahoo: 'HCLTECH.NS',     tv: 'NSE:HCLTECH',     sector: 'IT'         },
  { label: 'M&M',         id: 'M&M',         yahoo: 'M&M.NS',         tv: 'NSE:M_M',         sector: 'Auto'       },
  { label: 'ONGC',        id: 'ONGC',        yahoo: 'ONGC.NS',        tv: 'NSE:ONGC',        sector: 'Energy'     },
  { label: 'COALINDIA',   id: 'COALINDIA',   yahoo: 'COALINDIA.NS',   tv: 'NSE:COALINDIA',   sector: 'Mining'     },
  { label: 'JSWSTEEL',    id: 'JSWSTEEL',    yahoo: 'JSWSTEEL.NS',    tv: 'NSE:JSWSTEEL',    sector: 'Metal'      },
  // Indices (for watchlist display)
  { label: 'NIFTY 50',    id: '^NSEI',       yahoo: '^NSEI',          tv: 'NSE:NIFTY',       sector: 'Index',  isIndex: true },
  { label: 'BANK NIFTY',  id: '^NSEBANK',    yahoo: '^NSEBANK',       tv: 'NSE:BANKNIFTY',   sector: 'Index',  isIndex: true },
  { label: 'SENSEX',      id: '^BSESN',      yahoo: '^BSESN',         tv: 'BSE:SENSEX',      sector: 'Index',  isIndex: true },
];

// Symbols excluding indices (for main chart selection)
export const EQUITY_SYMBOLS = SYMBOLS.filter(s => !s.isIndex);

// ── Timeframes ────────────────────────────────────────────────────────────────
// id: our app ID, yahoo: Yahoo Finance interval, tv: TradingView resolution
export const TIMEFRAMES = [
  { label: '5m',  id: '5m',  yahoo: '5m',  tv: '5'   },
  { label: '15m', id: '15m', yahoo: '15m', tv: '15'  },
  { label: '30m', id: '30m', yahoo: '30m', tv: '30'  },
  { label: '45m', id: '45m', yahoo: '60m', tv: '45'  }, // YF has no 45m; uses 60m candles
  { label: '1h',  id: '1h',  yahoo: '60m', tv: '60'  },
  { label: '1D',  id: '1d',  yahoo: '1d',  tv: 'D'   },
  { label: '1W',  id: '1w',  yahoo: '1wk', tv: 'W'   },
  { label: '1M',  id: '1mo', yahoo: '1mo', tv: 'M'   },
];

// ── NSE Sectors for filtering ─────────────────────────────────────────────────
export const SECTORS = ['All', 'Banking', 'IT', 'Energy', 'FMCG', 'Pharma', 'Auto', 'Finance', 'Infra', 'Metal', 'Power', 'Telecom', 'Consumer', 'Mining'];

// ── Colors (same dark terminal palette as crypto-terminal) ────────────────────
export const COLORS = {
  bg:      '#0b0f1a',
  card:    '#101520',
  border:  '#1c2740',
  muted:   '#3a5270',
  text:    '#b8cce0',
  bright:  '#ddeeff',
  price:   '#3b82f6',
  ema9:    '#fbbf24',
  ema21:   '#f97316',
  ema50:   '#a78bfa',
  bb:      '#2a4060',
  rsi:     '#f97316',
  macd:    '#3b82f6',
  signal:  '#f85149',
  bull:    '#10d67a',
  bear:    '#f85149',
  neutral: '#d4a017',
  grid:    '#131e30',
  rupee:   '#fbbf24',  // Rupee symbol accent
};

export const REFRESH_INTERVAL = 60000; // 60 seconds (NSE data is less real-time via Yahoo Finance)
export const CANDLE_LIMIT = 250;

// ── NSE Market Hours (IST) ────────────────────────────────────────────────────
export const MARKET_OPEN_HOUR   = 9;
export const MARKET_OPEN_MIN    = 15;
export const MARKET_CLOSE_HOUR  = 15;
export const MARKET_CLOSE_MIN   = 30;

export function isMarketOpen() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day  = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const h = ist.getHours();
  const m = ist.getMinutes();
  const mins = h * 60 + m;
  const open  = MARKET_OPEN_HOUR  * 60 + MARKET_OPEN_MIN;
  const close = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MIN;
  return mins >= open && mins < close;
}

export function marketStatus() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  if (day === 0 || day === 6) return { open: false, label: 'Market Closed (Weekend)' };
  const h = ist.getHours();
  const m = ist.getMinutes();
  const mins = h * 60 + m;
  const open  = MARKET_OPEN_HOUR  * 60 + MARKET_OPEN_MIN;
  const close = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MIN;
  if (mins < open)  return { open: false, label: `Pre-Market (Opens ${MARKET_OPEN_HOUR}:${String(MARKET_OPEN_MIN).padStart(2,'0')} IST)` };
  if (mins >= close) return { open: false, label: 'Market Closed (15:30 IST)' };
  return { open: true, label: 'NSE Live' };
}
