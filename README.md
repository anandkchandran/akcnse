# ₹ akcnse — NSE Equities Terminal

Mobile-first web app for monitoring NSE equities with live charts, AI-powered trade signals, and paper trading. Built with the same UI standards as the crypto-terminal project.

## Features

- **Live NSE Data** — Yahoo Finance proxy via local server (no CORS issues)
- **TradingView Charts** — Advanced charts with live NSE data (`NSE:SYMBOL`)
- **SVG Indicator Charts** — Custom Price/EMA/BB, RSI(14), MACD(12,26,9)
- **AI Trade Signals** — Claude (dev) + Google Gemini (prod) equity analysis in INR
- **Paper Trading** — ₹1L virtual portfolio, SL/TP auto-trigger, trade history
- **NSE Watchlist** — NIFTY 50 gainers/losers with live prices
- **Mobile-First** — Responsive with bottom tab navigation
- **Dark/Light Theme** — Persistent user preference

## Quick Start

```bash
# Terminal 1 — Backend proxy server (serves NSE data + AI)
node server.js

# Terminal 2 — React frontend
npm start
```

Open http://localhost:3000

## Architecture

```
akcnse/
├── server.js              # Node proxy: Yahoo Finance NSE data + Claude CLI + Gemini
├── src/
│   ├── App.js             # Main 3-column layout (Watchlist | Chart | Signal)
│   ├── App.css            # Responsive CSS + mobile tab bar
│   ├── constants/
│   │   └── index.js       # 30+ NSE symbols (NIFTY 50), timeframes, market hours
│   ├── utils/
│   │   ├── format.js      # INR formatting (₹, lakhs, crores)
│   │   ├── indicators.js  # EMA, RSI, MACD, Bollinger Bands, ATR
│   │   ├── signals.js     # Multi-indicator weighted signal engine
│   │   ├── claude.js      # Claude AI integration (equity prompts in INR)
│   │   ├── gemini.js      # Google Gemini integration
│   │   └── nseDatafeed.js # TradingView JS API datafeed adapter
│   ├── hooks/
│   │   ├── useMarketData.js    # Fetch OHLCV from server → indicators → signal
│   │   └── useNseWatchlist.js  # Batch quotes for NIFTY 50 watchlist
│   ├── contexts/
│   │   └── ThemeContext.jsx    # Dark/light theme with localStorage persistence
│   └── components/
│       ├── Header.jsx          # Symbol search, timeframe picker, refresh
│       ├── TickerRow.jsx       # LTP, day change, high/low, volume
│       ├── Charts.jsx          # PriceChart, RSIChart, MACDChart wrappers
│       ├── SvgChart.jsx        # Reusable SVG charting engine
│       ├── TradingViewWidget.jsx # TradingView embedded chart (NSE:SYMBOL)
│       ├── SignalPanel.jsx     # BUY/SELL/HOLD signal, breakdown, indicators
│       ├── PaperTrading.jsx    # ₹1L virtual portfolio, SL/TP, history
│       ├── ClaudePanel.jsx     # Claude AI equity analysis (dev mode)
│       ├── GeminiPanel.jsx     # Gemini AI equity analysis (prod mode)
│       └── WatchList.jsx       # NSE gainers/losers from NIFTY 50
```

## Data Flow

1. **Frontend** → POST `/api/nse/chart` → **server.js**
2. **server.js** → GET `query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS` → Yahoo Finance
3. **server.js** parses OHLCV + ticker → returns JSON
4. **useMarketData.js** computes EMA/RSI/MACD/BB → `computeSignal()` → state
5. **Charts.jsx** renders SVG charts with indicator overlays
6. **TradingViewWidget.jsx** renders TradingView's `NSE:RELIANCE` symbol directly

## Configuration

### Environment Variables (`.env`)
```
SKIP_PREFLIGHT_CHECK=true
DISABLE_ESLINT_PLUGIN=true
```

### Server Environment Variables
```bash
# Set in your shell or .env.server file
export GEMINI_API_KEY=your_key_here   # Get free key at aistudio.google.com
export PORT=3001                       # Default port
```

### AI Setup
- **Claude (dev)**: Requires `claude` CLI installed locally (`npm install -g @anthropic-ai/claude-code`)
- **Gemini (prod)**: Add `GEMINI_API_KEY` to server environment

## NSE Data Source

Data is fetched from Yahoo Finance via the proxy server:
- **Endpoint**: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}.NS`
- **Supported intervals**: 5m, 15m, 1h (60m), 1d
- **Note**: Yahoo Finance may throttle requests. Data may be delayed up to 15 minutes.

## Paper Trading

- Starting balance: **₹1,00,000** (1 lakh)
- Buy NSE equities at current LTP
- Set Stop Loss (SL) and Take Profit (TP) — auto-triggers on price hit
- All positions persisted in localStorage
- Trade history kept for last 50 trades

## NSE Symbols Included

RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, HINDUNILVR, WIPRO, BAJFINANCE, SBIN, AXISBANK, LT, KOTAKBANK, ITC, TITAN, SUNPHARMA, TATAMOTORS, TATASTEEL, ADANIPORTS, POWERGRID, NTPC, MARUTI, BHARTIARTL, NESTLEIND, DRREDDY, CIPLA, HCLTECH, M&M, ONGC, COALINDIA, JSWSTEEL + NIFTY 50, BANK NIFTY, SENSEX indices

## Disclaimer

akcnse is for educational and informational purposes only. This is **not financial advice**. NSE equity trading involves substantial risk of loss. Always consult a SEBI-registered investment advisor.
