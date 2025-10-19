# QuantApp - Quantitative Trading Dashboard

A comprehensive Next.js web application for quantitative trading analysis with real-time stock data, technical indicators, risk scoring, and automated buy/sell signals powered by Upstox API.

## Features

### Core Functionality
- **Real-time Stock Analysis**: Fetch live and historical stock data from Upstox API
- **Technical Indicators**: RSI, MACD, Volume analysis with automated calculations
- **Risk Scoring**: Multi-factor risk assessment (volatility, volume, price deviation)
- **Buy/Sell Signals**: Automated trading signals with confidence scores
- **Stock Screener**: Filter stocks by signal type, risk level, and confidence
- **News Scraping**: Sentiment analysis from web sources
- **Target Notifications**: Webhook alerts for price targets and stop losses

### Technical Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (time-series collections)
- **Caching**: Redis with rate limiting
- **Charts**: TradingView Lightweight Charts
- **API**: Upstox API v2

## Installation

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Upstox API credentials

### Setup

1. **Clone and Install**
```bash
cd quantapp
npm install
```

2. **Configure Environment Variables**

Edit `.env.local`:
```env
# Upstox API
UPSTOX_API_KEY=your_api_key
UPSTOX_API_SECRET=your_api_secret
UPSTOX_ACCESS_TOKEN=your_access_token

# MongoDB
MONGODB_URI=mongodb://localhost:27017/quantapp
MONGODB_DB=quantapp

# Redis
REDIS_URL=redis://localhost:6379
# Or Upstash:
# UPSTASH_REDIS_REST_URL=your_upstash_url
# UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Webhook
WEBHOOK_URL=your_webhook_url
```

3. **Get Upstox API Access Token**

Visit [Upstox Developer Portal](https://upstox.com/developer/) and:
- Create an app
- Generate API key and secret
- Get access token using OAuth flow

4. **Start MongoDB and Redis**
```bash
# MongoDB (if local)
mongod

# Redis (if local)
redis-server
```

5. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
quantapp/
├── app/
│   ├── api/
│   │   ├── stocks/
│   │   │   ├── signals/      # Signal generation endpoint
│   │   │   ├── historical/   # Historical data endpoint
│   │   │   └── live/         # Real-time quotes
│   │   ├── scraper/
│   │   │   └── news/         # News scraping endpoint
│   │   └── screener/         # Stock screener endpoint
│   ├── dashboard/            # Main dashboard page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── lib/
│   ├── db/
│   │   ├── mongodb.ts        # MongoDB connection
│   │   └── schema.ts         # Database schemas
│   ├── cache/
│   │   └── redis.ts          # Redis caching & rate limiting
│   ├── upstox/
│   │   └── client.ts         # Upstox API wrapper
│   ├── indicators/
│   │   ├── rsi.ts            # RSI calculation
│   │   ├── macd.ts           # MACD calculation
│   │   └── volume.ts         # Volume analysis
│   ├── strategies/
│   │   ├── signals.ts        # Signal generation
│   │   └── risk.ts           # Risk scoring
│   ├── scraper/
│   │   └── news.ts           # News scraping
│   ├── notifications/
│   │   └── webhook.ts        # Webhook notifications
│   └── utils.ts              # Utility functions
├── components/
│   ├── charts/
│   │   └── StockChart.tsx    # TradingView chart
│   ├── tables/
│   │   └── StockList.tsx     # Stock list table
│   └── ui/
│       └── Card.tsx          # UI components
└── .env.local                # Environment variables
```

## API Endpoints

### Get Signal for Single Stock
```bash
GET /api/stocks/signals?symbol=NSE_EQ|INE002A01018
```

Response:
```json
{
  "symbol": "NSE_EQ|INE002A01018",
  "signal": {
    "type": "BUY",
    "confidence": 75.5,
    "entryPrice": 1234.50,
    "targetPrice": 1310.00,
    "stopLoss": 1185.00,
    "riskReward": 2.1,
    "riskScore": {
      "score": 35.2,
      "level": "MEDIUM"
    }
  }
}
```

### Get Signals for Multiple Stocks
```bash
POST /api/stocks/signals
Content-Type: application/json

{
  "symbols": ["NSE_EQ|INE002A01018", "NSE_EQ|INE009A01021"]
}
```

### Stock Screener
```bash
GET /api/screener?signal=BUY&risk=LOW&minConfidence=60
```

### Historical Data
```bash
GET /api/stocks/historical?symbol=NSE_EQ|INE002A01018&interval=1day&days=90
```

### News with Sentiment
```bash
GET /api/scraper/news?symbol=RELIANCE&maxResults=10
```

## Technical Indicators

### RSI (Relative Strength Index)
- **Period**: 14
- **Overbought**: > 70 (sell signal)
- **Oversold**: < 30 (buy signal)

### MACD (Moving Average Convergence Divergence)
- **Fast EMA**: 12
- **Slow EMA**: 26
- **Signal Line**: 9
- **Bullish**: MACD > Signal
- **Bearish**: MACD < Signal

### Volume Analysis
- **Volume Ratio**: Current / 20-day average
- **Breakout**: > 2x average volume

## Risk Scoring

Risk score (0-100) based on:
- **Volatility** (40%): Price standard deviation
- **Volume Abnormality** (30%): Deviation from average
- **Price Deviation** (30%): Distance from 20-day MA

### Risk Levels
- **LOW** (0-30): Conservative
- **MEDIUM** (30-60): Balanced
- **HIGH** (60-80): Aggressive
- **EXTREME** (80-100): Very risky

## Signal Generation

Signals combine multiple indicators:
1. **RSI** (30% weight)
2. **MACD** (35% weight)
3. **Volume** (25% weight)
4. **Risk Adjustment** (10% weight)

**Buy Signal**: Confidence > 50%
**Sell Signal**: Confidence < -50%

## Rate Limiting

- **Upstox API**: 500 req/min (handled by caching)
- **Web API**: 100 req/min per IP
- **News Scraping**: 8-14 second delays

## Caching Strategy

- **Live Data**: 15 seconds
- **Historical Data**: 15 minutes (intraday), 1 hour (daily)
- **Signals**: 15 minutes
- **News**: 30 minutes

## Notifications

Configure webhooks in `.env.local` to receive:
- Target hit alerts
- Stop loss alerts
- New signal alerts
- Risk alerts

Webhook payload:
```json
{
  "event": "target_hit",
  "symbol": "RELIANCE",
  "currentPrice": 2500,
  "targetPrice": 2450,
  "message": "🎯 Target hit!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Production Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy --prod
```

### Environment Variables
Set all variables from `.env.local` in your hosting provider's dashboard.

### Database Setup
1. Use MongoDB Atlas for production
2. Use Upstash Redis for serverless caching
3. Configure webhooks for notifications

## Performance Optimization

- **Server-side caching** with Redis
- **MongoDB time-series** collections for efficient storage
- **Batch requests** to Upstox (100 symbols per call)
- **Rate limiting** to prevent API overuse
- **Lazy loading** for charts and tables

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Troubleshooting

### Common Issues

**1. Upstox API Errors**
- Verify access token is valid
- Check rate limits (500 req/min)
- Ensure correct instrument keys

**2. MongoDB Connection Failed**
- Check MongoDB is running
- Verify connection string
- Check firewall rules

**3. Redis Connection Failed**
- Check Redis is running
- Verify REDIS_URL
- Check Upstash credentials

**4. Rate Limit Exceeded**
- Increase cache TTL
- Reduce request frequency
- Use batch endpoints

## Security

- Never commit `.env.local` to git
- Use environment variables for secrets
- Implement API authentication for production
- Enable CORS restrictions
- Use HTTPS in production

## License

MIT

## Disclaimer

This software is for educational purposes only. Trading stocks involves risk. Always do your own research and consult with financial advisors before making investment decisions.

## Support

For issues or questions:
- Create an issue on GitHub
- Check Upstox API documentation
- Review Next.js documentation

## Roadmap

- [ ] Backtesting engine
- [ ] Portfolio management
- [ ] Multiple timeframe analysis
- [ ] Custom indicator builder
- [ ] Real-time WebSocket updates
- [ ] Mobile app
- [ ] Paper trading mode
- [ ] Advanced charting tools
- [ ] Machine learning predictions
- [ ] Multi-exchange support

---

Built with Next.js, TypeScript, and Upstox API
#   Q u a n t a p p  
 #   Q u a n t a p p  
 #   Q u a n t a p p  
 #   Q u a n t a p p  
 #   Q u a n t a p p  
 #   Q u a n t a p p  
 #   Q u a n t a p p  
 