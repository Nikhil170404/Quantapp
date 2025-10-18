import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { checkRateLimit } from '@/lib/cache/simple-cache';
import { upstoxClient } from '@/lib/upstox/client';
import { generateSignal } from '@/lib/strategies/signals';
import { NIFTY50_STOCKS, getStockInfo } from '@/lib/constants/nifty50';

interface ErrorDetail {
  symbol: string;
  name: string;
  error: string;
}

interface StockResult {
  symbol: string;
  name: string;
  shortName: string;
  sector: string;
  signal: any;
  timestamp: Date;
  dataPoints: number;
  cached: boolean;
}

/**
 * Batch process all Nifty 50 stocks
 * This endpoint fetches and analyzes all 50 stocks
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const allowed = await checkRateLimit(ip, 10, 60000);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { db } = await connectToDatabase();
    const results: StockResult[] = [];
    const errors: ErrorDetail[] = [];

    console.log(`Starting batch processing of ${NIFTY50_STOCKS.length} stocks...`);

    // Process stocks in batches of 5 to avoid overloading Upstox API
    const batchSize = 5;
    for (let i = 0; i < NIFTY50_STOCKS.length; i += batchSize) {
      const batch = NIFTY50_STOCKS.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(NIFTY50_STOCKS.length / batchSize)}...`);
      
      const batchPromises = batch.map(async (stockInfo) => {
        try {
          // Check if we already have recent data (less than 15 minutes old)
          const existing = await db.collection('signals').findOne({
            symbol: stockInfo.symbol,
            timestamp: { $gte: new Date(Date.now() - 900000) } // 15 minutes
          });

          if (existing) {
            console.log(`Using cached data for ${stockInfo.shortName}`);
            return {
              ...existing,
              cached: true
            } as StockResult;
          }

          // Fetch historical data
          const toDate = new Date();
          const fromDate = new Date();
          fromDate.setDate(toDate.getDate() - 90);

          const formatDate = (date: Date) => date.toISOString().split('T')[0];

          console.log(`Fetching data for ${stockInfo.shortName}...`);

          const historicalData = await upstoxClient.getHistoricalData(
            stockInfo.symbol,
            'day',
            formatDate(fromDate),
            formatDate(toDate)
          );

          if (!historicalData || historicalData.length === 0) {
            throw new Error('No historical data available');
          }

          console.log(`Fetched ${historicalData.length} candles for ${stockInfo.shortName}`);

          // Extract prices and volumes
          const prices = historicalData.map((candle) => candle.close);
          const volumes = historicalData.map((candle) => candle.volume);
          const highs = historicalData.map((candle) => candle.high);
          const lows = historicalData.map((candle) => candle.low);

          // Generate signal
          const signal = generateSignal(prices, volumes, highs, lows);

          const result: StockResult = {
            symbol: stockInfo.symbol,
            name: stockInfo.name,
            shortName: stockInfo.shortName,
            sector: stockInfo.sector,
            signal,
            timestamp: new Date(),
            dataPoints: historicalData.length,
            cached: false
          };

          // Upsert into MongoDB (update if exists, insert if not)
          await db.collection('signals').updateOne(
            { symbol: stockInfo.symbol },
            { 
              $set: result,
              $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
          );

          console.log(`✓ Successfully processed ${stockInfo.shortName}`);
          return result;
        } catch (error: any) {
          console.error(`✗ Error processing ${stockInfo.symbol}:`, error.message);
          errors.push({
            symbol: stockInfo.symbol,
            name: stockInfo.name,
            error: error.message
          });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((r): r is StockResult => r !== null));

      // Delay between batches to respect rate limits
      if (i + batchSize < NIFTY50_STOCKS.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`Batch processing complete: ${results.length} succeeded, ${errors.length} failed`);

    return NextResponse.json({
      success: true,
      total: NIFTY50_STOCKS.length,
      processed: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
      timestamp: new Date()
    });
  } catch (error: any) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process stocks',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

/**
 * Get batch processing status and all signals
 */
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    // Get all signals from last 24 hours
    const signals = await db
      .collection('signals')
      .find({
        timestamp: { $gte: new Date(Date.now() - 86400000) }
      })
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`Found ${signals.length} signals in database`);

    // Group by sector
    const bySector: Record<string, any[]> = {};
    const bySignal = { BUY: 0, SELL: 0, HOLD: 0 };
    const byRisk = { LOW: 0, MEDIUM: 0, HIGH: 0, EXTREME: 0 };

    signals.forEach(s => {
      // Group by sector
      if (!bySector[s.sector]) {
        bySector[s.sector] = [];
      }
      bySector[s.sector].push(s);

      // Count signals
      if (s.signal?.type) {
        bySignal[s.signal.type as keyof typeof bySignal]++;
      }

      // Count risk levels
      if (s.signal?.riskScore?.level) {
        byRisk[s.signal.riskScore.level as keyof typeof byRisk]++;
      }
    });

    // Get top performers
    const topBuy = signals
      .filter(s => s.signal?.type === 'BUY')
      .sort((a, b) => (b.signal?.confidence || 0) - (a.signal?.confidence || 0))
      .slice(0, 10);

    const topSell = signals
      .filter(s => s.signal?.type === 'SELL')
      .sort((a, b) => (b.signal?.confidence || 0) - (a.signal?.confidence || 0))
      .slice(0, 10);

    return NextResponse.json({
      total: signals.length,
      nifty50Total: NIFTY50_STOCKS.length,
      coverage: `${((signals.length / NIFTY50_STOCKS.length) * 100).toFixed(1)}%`,
      bySignal,
      byRisk,
      bySector: Object.keys(bySector).map(sector => ({
        sector,
        count: bySector[sector].length,
        signals: {
          buy: bySector[sector].filter(s => s.signal?.type === 'BUY').length,
          sell: bySector[sector].filter(s => s.signal?.type === 'SELL').length
        }
      })),
      topBuy,
      topSell,
      lastUpdate: signals[0]?.timestamp || null
    });
  } catch (error: any) {
    console.error('Status fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status' },
      { status: 500 }
    );
  }
}