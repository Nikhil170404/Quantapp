# Quick Start Guide - QuantApp

Get your quantitative trading dashboard up and running in minutes!

## Prerequisites Checklist

Before you begin, ensure you have:
- ✅ Node.js 20+ installed
- ✅ MongoDB running (local or Atlas)
- ✅ Redis running (local or Upstash)
- ✅ Upstox API credentials

## 5-Minute Setup

### Step 1: Environment Configuration (2 minutes)

Edit the `.env.local` file in the project root:

```env
# Upstox API - Get from https://upstox.com/developer/
UPSTOX_API_KEY=your_api_key_here
UPSTOX_API_SECRET=your_api_secret_here
UPSTOX_ACCESS_TOKEN=your_access_token_here

# MongoDB - Use local or Atlas
MONGODB_URI=mongodb://localhost:27017/quantapp
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quantapp

# Redis - Use local or Upstash
REDIS_URL=redis://localhost:6379
# Or Upstash:
# UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your_token

# Optional: Webhook for notifications
WEBHOOK_URL=https://your-webhook.com/notify
```

### Step 2: Install Dependencies (1 minute)

```bash
npm install
```

### Step 3: Start Development Server (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4: Test the App (1 minute)

**Test API endpoint:**
```bash
curl "http://localhost:3000/api/stocks/signals?symbol=NSE_EQ|INE002A01018"
```

**Or use the UI:**
1. Open the dashboard
2. Search for a stock: `NSE_EQ|INE002A01018` (Reliance)
3. Click "Analyze"
4. View signals, risk scores, and technical indicators

## Sample Stock Symbols to Try

Copy and paste these into the search bar:

### Low Risk Stocks
```
NSE_EQ|INE467B01029    (TCS)
NSE_EQ|INE040A01034    (HDFC Bank)
NSE_EQ|INE021A01026    (Asian Paints)
```

### Medium Risk Stocks
```
NSE_EQ|INE002A01018    (Reliance)
NSE_EQ|INE009A01021    (Infosys)
NSE_EQ|INE090A01021    (ICICI Bank)
```

### High Risk Stocks
```
NSE_EQ|INE155A01022    (Tata Motors)
NSE_EQ|INE397D01024    (Bharti Airtel)
```

## Common Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Check code quality
```

## API Endpoints Quick Reference

### Get Signal
```bash
GET /api/stocks/signals?symbol=NSE_EQ|INE002A01018
```

### Get Historical Data
```bash
GET /api/stocks/historical?symbol=NSE_EQ|INE002A01018&interval=1day&days=90
```

### Stock Screener
```bash
GET /api/screener
GET /api/screener?signal=BUY&risk=LOW&minConfidence=60
```

### News & Sentiment
```bash
GET /api/scraper/news?symbol=RELIANCE&maxResults=10
```

### Batch Signals
```bash
POST /api/stocks/signals
Content-Type: application/json

{
  "symbols": [
    "NSE_EQ|INE002A01018",
    "NSE_EQ|INE467B01029"
  ]
}
```

## Understanding the Dashboard

### Signal Indicators

**Buy Signal (Green)**
- RSI < 30 (oversold)
- MACD bullish crossover
- High volume breakout
- Confidence > 50%

**Sell Signal (Red)**
- RSI > 70 (overbought)
- MACD bearish crossover
- High volume breakdown
- Confidence < -50%

### Risk Levels

| Level | Score | Description |
|-------|-------|-------------|
| 🟢 LOW | 0-30 | Conservative, low volatility |
| 🟡 MEDIUM | 30-60 | Balanced risk-reward |
| 🟠 HIGH | 60-80 | Aggressive, high volatility |
| 🔴 EXTREME | 80-100 | Very risky, avoid or use caution |

### Technical Indicators

**RSI (Relative Strength Index)**
- Range: 0-100
- Overbought: > 70
- Oversold: < 30
- Neutral: 30-70

**MACD (Moving Average Convergence Divergence)**
- Bullish: MACD line > Signal line
- Bearish: MACD line < Signal line
- Histogram shows momentum strength

**Volume Ratio**
- > 2.0x: Breakout/breakdown
- 1.5-2.0x: Above average activity
- < 1.5x: Normal trading

## Troubleshooting

### "Cannot connect to MongoDB"
**Solution**:
```bash
# Check if MongoDB is running
mongosh
# Or start MongoDB service
net start MongoDB
```

### "Cannot connect to Redis"
**Solution**:
```bash
# Check if Redis is running (WSL)
sudo service redis-server status
# Start if needed
sudo service redis-server start
```

### "Upstox API 401 Unauthorized"
**Solution**:
- Access token expired (refresh daily)
- Verify credentials in `.env.local`
- Generate new access token

### "No data available"
**Solution**:
- Check stock symbol format
- Market might be closed
- Try different symbol

### Build Errors
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

## What You Can Do

### Analyze Individual Stocks
1. Search for a stock symbol
2. View real-time signals (BUY/SELL/HOLD)
3. Check technical indicators (RSI, MACD, Volume)
4. See risk score and recommendations
5. Get entry price, target, and stop loss

### Screen for Opportunities
1. Filter by signal type (BUY/SELL)
2. Filter by risk level (LOW/MEDIUM/HIGH)
3. Set minimum confidence threshold
4. Sort by confidence or risk

### Track Portfolio
1. Add stocks to watchlist (coming soon)
2. Set price alerts
3. Monitor target hits
4. Get webhook notifications

## Next Steps

1. ✅ Complete setup and test the dashboard
2. 📊 Explore different stocks and sectors
3. 🔔 Configure webhook notifications
4. 📈 Analyze signal patterns
5. 🚀 Deploy to production (Vercel)

## Getting Help

- **Setup Issues**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Stock Symbols**: See [STOCK_SYMBOLS.md](STOCK_SYMBOLS.md)
- **Full Documentation**: See [README.md](README.md)

## Production Deployment

### Deploy to Vercel (2 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Then set environment variables in Vercel dashboard.

## Tips for Best Results

1. **Use quality symbols**: Stick to liquid stocks (Nifty 50, Bank Nifty)
2. **Check during market hours**: 9:15 AM - 3:30 PM IST
3. **Combine signals**: Don't rely on one indicator alone
4. **Monitor risk scores**: Lower risk = more conservative
5. **Set realistic targets**: 4-8% gains are typical
6. **Use stop losses**: Protect your capital

## Performance Benchmarks

- **Signal Generation**: < 2 seconds
- **Historical Data Fetch**: < 1 second (cached)
- **Stock Screener**: < 3 seconds (100 stocks)
- **News Scraping**: 8-15 seconds (rate limiting)

## System Requirements

- **Minimum**: 2GB RAM, 2-core CPU
- **Recommended**: 4GB RAM, 4-core CPU
- **Storage**: 500MB for app + database
- **Network**: Stable internet (API calls)

## Security Notes

- ⚠️ Never commit `.env.local` to git
- ⚠️ Keep API credentials secure
- ⚠️ Use HTTPS in production
- ⚠️ Enable CORS restrictions
- ⚠️ Implement API authentication

---

**Ready to start?** Run `npm run dev` and open http://localhost:3000

Happy Trading! 📈
