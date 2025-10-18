# Testing Your QuantApp

## ✅ Quick Test Checklist

### 1. Test MongoDB Connection
```
http://localhost:3000/api/test
```

**Expected Response:**
```json
{
  "status": "ok",
  "mongodb": "connected",
  "signalsCount": 0,
  "message": "MongoDB connected but no signals yet..."
}
```

### 2. Test Stock Signal Generation

**Method 1: Use the UI**
1. Go to http://localhost:3000
2. In the search box, enter: `NSE_EQ|INE002A01018`
3. Click "Analyze"
4. You should see:
   - Buy/Sell signal
   - Risk score
   - RSI, MACD indicators
   - Entry price, target, stop loss

**Method 2: Use API Directly**
```
http://localhost:3000/api/stocks/signals?symbol=NSE_EQ|INE002A01018
```

### 3. Test Screener (After Generating Signals)

After analyzing 3-5 stocks, check:
```
http://localhost:3000/api/screener
```

Should show:
- Total signals
- Buy/Sell counts
- Risk distribution

### 4. Popular Stocks to Test

**Low Risk:**
```
NSE_EQ|INE467B01029  (TCS - IT)
NSE_EQ|INE040A01034  (HDFC Bank)
NSE_EQ|INE021A01026  (Asian Paints)
```

**Medium Risk:**
```
NSE_EQ|INE002A01018  (Reliance)
NSE_EQ|INE009A01021  (Infosys)
NSE_EQ|INE090A01021  (ICICI Bank)
```

**High Risk:**
```
NSE_EQ|INE155A01022  (Tata Motors)
NSE_EQ|INE397D01024  (Bharti Airtel)
```

## 🔍 What Each Endpoint Does

### `/api/test`
- Tests MongoDB connection
- Returns signal count
- Quick health check

### `/api/stocks/signals?symbol=XXX`
- Fetches historical data from Upstox
- Calculates RSI, MACD, Volume
- Generates buy/sell signal
- Saves to MongoDB
- Returns signal with confidence score

### `/api/stocks/historical?symbol=XXX&interval=1day&days=90`
- Gets historical OHLC data
- Used for backtesting
- Cached for performance

### `/api/screener`
- Lists all recent signals
- Filters by risk/signal type
- Sorted by confidence

### `/api/scraper/news?symbol=RELIANCE`
- Scrapes news for stock
- Analyzes sentiment
- Takes 10-15 seconds (rate limiting)

## 🎯 Expected Signal Output

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
      "level": "MEDIUM",
      "volatility": 12.5,
      "volumeRatio": 1.8,
      "priceDeviation": 3.2
    },
    "indicators": {
      "rsi": 45.2,
      "macd": {
        "macd": 12.5,
        "signal": 10.2,
        "histogram": 2.3
      },
      "volumeRatio": 1.8
    },
    "reasons": [
      "RSI neutral at 45.2",
      "MACD bullish crossover",
      "Above average volume"
    ]
  }
}
```

## 🐛 Troubleshooting

### Error: "No data available for this symbol"
**Cause:** Invalid symbol format or market closed
**Fix:**
- Use correct format: `NSE_EQ|ISIN_CODE`
- Check market hours (9:15 AM - 3:30 PM IST)
- Try a different stock

### Error: "Upstox API 401 Unauthorized"
**Cause:** Access token expired
**Fix:**
- Tokens expire daily
- Generate new token from Upstox developer portal
- Update `.env.local`

### Error: "Rate limit exceeded"
**Cause:** Too many requests
**Fix:**
- Wait 1 minute
- App has in-memory rate limiting (100 req/min)

### Dashboard shows all zeros
**Cause:** No signals generated yet
**Fix:**
- Search for stocks individually
- Signals will populate the screener

### MongoDB connection error
**Cause:** Wrong connection string
**Fix:**
- Verify MongoDB URI in `.env.local`
- Check Atlas IP whitelist
- Test with `/api/test` endpoint

## 📊 Performance Benchmarks

| Operation | Expected Time |
|-----------|---------------|
| Stock signal generation | 1-3 seconds |
| Historical data fetch | 0.5-1 second |
| Screener query | < 500ms |
| News scraping | 10-15 seconds |
| Dashboard load | < 2 seconds |

## ✨ Features to Test

### 1. Technical Indicators
- RSI (0-100 scale)
- MACD (bullish/bearish)
- Volume ratio (breakout detection)

### 2. Risk Scoring
- LOW (0-30)
- MEDIUM (30-60)
- HIGH (60-80)
- EXTREME (80-100)

### 3. Signal Confidence
- > 70%: Strong signal
- 50-70%: Moderate signal
- < 50%: Weak signal

### 4. Price Targets
- Entry price (current)
- Target (6-8% gain)
- Stop loss (3-5% loss)
- Risk-reward ratio

## 🚀 Next Steps

After basic testing:

1. **Analyze 10+ stocks** to populate screener
2. **Test different timeframes** (1day, 1hour, 5min)
3. **Try filters** on screener (risk, signal type)
4. **Check news sentiment** for key stocks
5. **Monitor target hits** (if you set up webhooks)

## 📝 Test Data

Run this to quickly test multiple stocks:

```bash
# In browser console or Postman
const stocks = [
  'NSE_EQ|INE002A01018',  // Reliance
  'NSE_EQ|INE467B01029',  // TCS
  'NSE_EQ|INE040A01034',  // HDFC Bank
  'NSE_EQ|INE009A01021',  // Infosys
  'NSE_EQ|INE090A01021',  // ICICI Bank
];

for (const symbol of stocks) {
  fetch(`/api/stocks/signals?symbol=${symbol}`)
    .then(r => r.json())
    .then(d => console.log(symbol, d.signal.type, d.signal.confidence));
}
```

---

**All tests passing?** You're ready to use the app! 🎉
