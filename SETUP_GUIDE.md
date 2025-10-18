# QuantApp Setup Guide

Complete step-by-step guide to set up and run your quantitative trading application.

## Prerequisites Installation

### 1. Install Node.js
Download and install Node.js 20+ from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
npm --version
```

### 2. Install MongoDB

**Option A: Local Installation (Windows)**
1. Download MongoDB Community Server from [mongodb.com/download-center/community](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. Start MongoDB:
   ```bash
   net start MongoDB
   ```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Use this in `.env.local`

### 3. Install Redis

**Option A: Local Installation (Windows)**
1. Install WSL2 first: `wsl --install`
2. Install Redis in WSL:
   ```bash
   sudo apt-get update
   sudo apt-get install redis-server
   sudo service redis-server start
   ```

**Option B: Upstash (Cloud - Recommended)**
1. Sign up at [upstash.com](https://upstash.com/)
2. Create a Redis database
3. Copy REST URL and token
4. Use these in `.env.local`

## Upstox API Setup

### Step 1: Create Upstox Developer Account
1. Go to [upstox.com/developer](https://upstox.com/developer/)
2. Sign in with your Upstox account
3. Click "Create App"

### Step 2: Create App
- **App Name**: QuantApp
- **Redirect URL**: `http://localhost:3000/auth/callback`
- **Type**: Web Application
- Click "Create"

### Step 3: Get Credentials
You'll receive:
- **API Key**: Your public API key
- **API Secret**: Your secret key (keep this safe!)

### Step 4: Generate Access Token

**Manual Method** (for testing):
1. Get authorization code:
   ```
   https://api.upstox.com/v2/login/authorization/dialog?client_id=YOUR_API_KEY&redirect_uri=http://localhost:3000/auth/callback&response_type=code
   ```
2. Login and authorize
3. You'll be redirected with a `code` parameter
4. Exchange code for token:
   ```bash
   curl -X POST https://api.upstox.com/v2/login/authorization/token \
     -H "accept: application/json" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "code=YOUR_CODE&client_id=YOUR_API_KEY&client_secret=YOUR_API_SECRET&redirect_uri=http://localhost:3000/auth/callback&grant_type=authorization_code"
   ```

**Important**: Access tokens expire daily. You'll need to refresh them.

## Project Setup

### Step 1: Install Dependencies
```bash
cd quantapp
npm install
```

If you encounter peer dependency errors:
```bash
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables

Create `.env.local` file:
```env
# Upstox API Configuration
UPSTOX_API_KEY=your_api_key_here
UPSTOX_API_SECRET=your_api_secret_here
UPSTOX_ACCESS_TOKEN=your_access_token_here

# MongoDB Configuration
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/quantapp
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quantapp?retryWrites=true&w=majority
MONGODB_DB=quantapp

# Redis Configuration
# For local Redis:
REDIS_URL=redis://localhost:6379
# For Upstash Redis:
# UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your_token_here

# Webhook for notifications (optional)
WEBHOOK_URL=https://your-webhook-url.com/notify

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Verify Database Connections

**Test MongoDB**:
```bash
# For local MongoDB
mongosh
> show dbs
> use quantapp
> db.test.insertOne({test: "data"})
> db.test.find()
```

**Test Redis**:
```bash
# For local Redis (in WSL)
redis-cli
> PING
# Should return PONG
```

### Step 4: Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## First-Time Usage

### 1. Get Stock Symbols

Upstox uses instrument keys like:
- `NSE_EQ|INE002A01018` (Reliance Industries)
- `NSE_EQ|INE009A01021` (Infosys)
- `NSE_EQ|INE467B01029` (Tata Consultancy Services)

**Find instrument keys**:
```bash
curl -X GET "https://assets.upstox.com/market-quote/instruments/exchange/NSE" \
  -H "Accept: text/csv" > instruments.csv
```

### 2. Test API Endpoints

**Get signal for a stock**:
```bash
curl "http://localhost:3000/api/stocks/signals?symbol=NSE_EQ|INE002A01018"
```

**Get historical data**:
```bash
curl "http://localhost:3000/api/stocks/historical?symbol=NSE_EQ|INE002A01018&interval=1day&days=90"
```

**Run screener**:
```bash
curl "http://localhost:3000/api/screener"
```

### 3. Populate Database

To populate the database with signals, you can create a seed script or manually call the signals API for multiple stocks:

```bash
# Create a file: scripts/seed.js
const symbols = [
  'NSE_EQ|INE002A01018',  // Reliance
  'NSE_EQ|INE009A01021',  // Infosys
  'NSE_EQ|INE467B01029',  // TCS
  // Add more symbols
];

async function seedData() {
  for (const symbol of symbols) {
    const response = await fetch(`http://localhost:3000/api/stocks/signals?symbol=${symbol}`);
    const data = await response.json();
    console.log(`Seeded: ${symbol}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  }
}

seedData();
```

Run it:
```bash
node scripts/seed.js
```

## Common Upstox Symbol Formats

### NSE Stocks (Equity)
- Format: `NSE_EQ|ISIN_CODE`
- Example: `NSE_EQ|INE002A01018` (Reliance)

### BSE Stocks (Equity)
- Format: `BSE_EQ|SCRIP_CODE`
- Example: `BSE_EQ|500325` (Reliance on BSE)

### NSE Indices
- Format: `NSE_INDEX|{INDEX_NAME}`
- Example: `NSE_INDEX|NIFTY 50`

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution**:
- Verify MongoDB is running: `mongosh`
- Check connection string in `.env.local`
- For Atlas: Whitelist your IP address in MongoDB Atlas dashboard

### Issue: "Cannot connect to Redis"
**Solution**:
- Verify Redis is running: `redis-cli PING`
- Check REDIS_URL in `.env.local`
- For Upstash: Verify REST URL and token

### Issue: "Upstox API returns 401 Unauthorized"
**Solution**:
- Access token expired (refresh it)
- Check API key and secret
- Verify token in `.env.local`

### Issue: "Rate limit exceeded"
**Solution**:
- Increase cache TTL in `lib/cache/redis.ts`
- Reduce request frequency
- Use batch endpoints

### Issue: "No data available for symbol"
**Solution**:
- Verify symbol format (use Upstox instrument key format)
- Check if market is open
- Try a different symbol

## Production Deployment

### Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Build project**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set environment variables** in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`

### Database for Production

**MongoDB Atlas** (Recommended):
- Free tier available
- Automatic backups
- Global distribution

**Upstash Redis** (Recommended):
- Serverless pricing
- Global edge caching
- Built for Next.js

## Performance Tips

1. **Use batch requests** for multiple stocks
2. **Enable caching** with appropriate TTLs
3. **Implement request queuing** for rate limiting
4. **Use MongoDB time-series** collections
5. **Optimize chart data** (reduce data points for performance)

## Next Steps

1. ✅ Set up all services (MongoDB, Redis, Upstox)
2. ✅ Configure environment variables
3. ✅ Run development server
4. ✅ Test API endpoints
5. ✅ Populate database with sample data
6. ✅ Configure webhooks (optional)
7. ✅ Deploy to production

## Support Resources

- **Upstox API Docs**: [upstox.com/developer/api-documentation](https://upstox.com/developer/api-documentation)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **MongoDB Docs**: [docs.mongodb.com](https://docs.mongodb.com)
- **Redis Docs**: [redis.io/docs](https://redis.io/docs)

---

Need help? Check the troubleshooting section or create an issue on GitHub.
