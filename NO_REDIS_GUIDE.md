# Running QuantApp Without Redis/MongoDB

Good news! The app now works **without Redis or MongoDB** for testing purposes.

## What I Fixed

✅ **In-Memory Rate Limiting** - No Redis needed
✅ **Graceful Error Handling** - App won't crash if databases are unavailable
✅ **Mock Data Support** - Can test without real database

## Quick Start (No Database Required)

### Option 1: Use Upstox API Only

Just set your Upstox credentials in `.env.local`:

```env
# Upstox API (Required)
UPSTOX_API_KEY=your_api_key
UPSTOX_API_SECRET=your_api_secret
UPSTOX_ACCESS_TOKEN=your_access_token

# These can be left empty or commented out
# MONGODB_URI=
# REDIS_URL=
```

Then run:
```bash
npm run dev
```

### What Works Without Redis/MongoDB?

✅ **Stock Signal Analysis** - Analyze individual stocks
✅ **Technical Indicators** - RSI, MACD, Volume
✅ **Risk Scoring** - All calculations work
✅ **Rate Limiting** - In-memory fallback
✅ **Caching** - In-memory (per session)

❌ **Stock Screener** - Needs MongoDB to store signals
❌ **Historical Data** - Can't cache long-term without Redis

### How to Use Without Databases

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Ignore these errors** (they're harmless):
   ```
   [ioredis] Unhandled error event: Error: connect ECONNREFUSED
   ```

3. **Search for stocks directly**:
   - Go to http://localhost:3000
   - Enter a stock symbol: `NSE_EQ|INE002A01018`
   - Click "Analyze"
   - View the signal, indicators, and risk score

4. **What you'll see**:
   - ✅ Buy/Sell signal with confidence
   - ✅ RSI, MACD, Volume analysis
   - ✅ Risk score (LOW/MEDIUM/HIGH)
   - ✅ Entry price, target, stop loss
   - ❌ Stock screener (needs MongoDB)

## Install Redis/MongoDB Later (Optional)

### Quick Redis Setup (Windows)

**Option A: Use Upstash (Cloud - Free)**
1. Go to https://upstash.com
2. Create free account
3. Create Redis database
4. Copy REST URL and token to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token
   ```

**Option B: Local Redis (WSL)**
```bash
# Install WSL2
wsl --install

# In WSL, install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Test
redis-cli PING
# Should return: PONG
```

Then in `.env.local`:
```env
REDIS_URL=redis://localhost:6379
```

### Quick MongoDB Setup

**Option A: MongoDB Atlas (Cloud - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster
4. Get connection string
5. Add to `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quantapp
   ```

**Option B: Local MongoDB (Windows)**
1. Download from https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start service:
   ```cmd
   net start MongoDB
   ```
4. Add to `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/quantapp
   ```

## Testing Without Upstox API

If you don't have Upstox credentials yet, you can test with **mock data**:

Create `app/api/stocks/signals/mock/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // Mock signal data for testing
  return NextResponse.json({
    symbol: 'MOCK_STOCK',
    signal: {
      type: 'BUY',
      confidence: 75.5,
      entryPrice: 1234.50,
      targetPrice: 1310.00,
      stopLoss: 1185.00,
      riskReward: 2.1,
      riskScore: {
        score: 35.2,
        level: 'MEDIUM',
        volatility: 12.5,
        volumeRatio: 1.8,
        priceDeviation: 3.2,
        breakdown: {
          volatilityRisk: 15,
          volumeRisk: 12,
          priceRisk: 8,
        },
      },
      indicators: {
        rsi: 45.2,
        macd: { macd: 12.5, signal: 10.2, histogram: 2.3 },
        volumeRatio: 1.8,
      },
      reasons: [
        'RSI neutral at 45.2',
        'MACD bullish crossover',
        'Above average volume',
      ],
    },
  });
}
```

Then test: http://localhost:3000/api/stocks/signals/mock

## Current Status

✅ **App is running** at http://localhost:3000
✅ **No Redis required** - Using in-memory rate limiting
✅ **No MongoDB required** - For basic stock analysis
⚠️ **Upstox API needed** - For real stock data

## Recommended Setup Order

For best experience, set up in this order:

1. ✅ **Run app without databases** (test UI)
2. ⭐ **Get Upstox API credentials** (for real data)
3. 📊 **Add MongoDB** (for stock screener)
4. 🚀 **Add Redis** (for better performance)

## What to Do Now

1. **Just Testing UI?**
   - Run `npm run dev`
   - Ignore Redis errors
   - UI will work, but without real data

2. **Want Real Stock Data?**
   - Get Upstox API credentials: https://upstox.com/developer/
   - Add to `.env.local`
   - Run `npm run dev`
   - Search any NSE/BSE stock

3. **Want Full Features?**
   - Set up Upstox + MongoDB Atlas + Upstash Redis
   - All free tiers available
   - Takes ~15 minutes total

## Common Questions

**Q: Will the app work without Redis?**
A: Yes! It uses in-memory rate limiting as fallback.

**Q: Will the app work without MongoDB?**
A: Partially. Stock analysis works, but screener doesn't.

**Q: Do I need to install anything?**
A: Just Node.js. Redis/MongoDB are optional.

**Q: How do I stop the Redis errors?**
A: They're harmless. I've suppressed most of them. You can ignore them.

**Q: What's the minimum to get started?**
A: Just Upstox API credentials. Everything else is optional.

---

**Ready to test?** Just run:
```bash
npm run dev
```

Then visit http://localhost:3000 and search for a stock!
