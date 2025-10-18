import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getCachedData, setCachedData } from '@/lib/cache/simple-cache';
import { upstoxClient } from '@/lib/upstox/client';
import { generateComprehensiveSignal } from '@/lib/strategies/comprehensive';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getStockInfo } from '@/lib/constants/nifty50';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const allowed = await checkRateLimit(ip, 100, 60000);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Check cache first (15 minutes)
    const cacheKey = `analysis:${symbol}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log(`Returning cached analysis for ${symbol}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    // Get stock info
    const stockInfo = getStockInfo(symbol);
    if (!stockInfo) {
      return NextResponse.json(
        { error: 'Stock not found in Nifty 50. Please check the symbol.' },
        { status: 404 }
      );
    }

    // Fetch historical data from Upstox
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 90); // 90 days

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    console.log(`Fetching data for ${stockInfo.shortName} (${symbol})...`);

    let historicalData;
    try {
      historicalData = await upstoxClient.getHistoricalData(
        symbol,
        'day',
        formatDate(fromDate),
        formatDate(toDate)
      );
    } catch (error: any) {
      console.error('Upstox API error:', error);

      // Provide helpful error message
      let errorMessage = 'Failed to fetch stock data. ';
      if (error.message?.includes('authentication') || error.message?.includes('401')) {
        errorMessage += 'Your Upstox access token may have expired. Please generate a new one.';
      } else if (error.message?.includes('symbol') || error.message?.includes('400')) {
        errorMessage += 'Invalid stock symbol or date range. Please try again.';
      } else if (error.message?.includes('429')) {
        errorMessage += 'Too many requests. Please try again in a minute.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json(
        {
          error: 'No historical data available for this symbol. The market might be closed or the symbol may be invalid.',
          hint: 'Market hours: 9:15 AM - 3:30 PM IST on weekdays'
        },
        { status: 404 }
      );
    }

    console.log(`Fetched ${historicalData.length} candles for ${stockInfo.shortName}`);

    // Extract prices, volumes, highs, lows
    const prices = historicalData.map((candle) => candle.close);
    const volumes = historicalData.map((candle) => candle.volume);
    const highs = historicalData.map((candle) => candle.high);
    const lows = historicalData.map((candle) => candle.low);
    const opens = historicalData.map((candle) => candle.open);

    // Generate comprehensive trading signal with all indicators
    const analysis = generateComprehensiveSignal(prices, volumes, highs, lows, opens);

    const result = {
      symbol,
      name: stockInfo.name,
      shortName: stockInfo.shortName,
      sector: stockInfo.sector,
      ...analysis,
      prices: prices.slice(-30), // Last 30 days for reference
      timestamp: new Date(),
      dataPoints: historicalData.length,
    };

    // Cache for 15 minutes
    await setCachedData(cacheKey, result, 900);

    // Store in MongoDB
    try {
      const { db } = await connectToDatabase();
      await db.collection('analyses').insertOne({
        ...result,
        createdAt: new Date(),
      });
      console.log(`Stored analysis for ${stockInfo.shortName} in MongoDB`);
    } catch (dbError) {
      console.error('MongoDB insert error:', dbError);
      // Continue even if DB insert fails
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}