import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getCachedData, setCachedData } from '@/lib/cache/simple-cache';
import { upstoxClient } from '@/lib/upstox/client';
import { generateSignal } from '@/lib/strategies/signals';
import { connectToDatabase } from '@/lib/db/mongodb';

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

    // Check cache first
    const cacheKey = `signal:${symbol}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch historical data from Upstox
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 90);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    console.log('Requesting historical data:', {
      symbol,
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
    });

    let historicalData;
    try {
      historicalData = await upstoxClient.getHistoricalData(
        symbol,
        'day',  // ✅ FIXED: Changed from '1day' to 'day'
        formatDate(fromDate),
        formatDate(toDate)
      );
    } catch (error: any) {
      console.error('Upstox API error:', error);

      // Provide helpful error message
      let errorMessage = 'Failed to fetch stock data. ';
      if (error.message?.includes('authentication')) {
        errorMessage += 'Your Upstox access token may have expired. Please generate a new one.';
      } else if (error.message?.includes('symbol')) {
        errorMessage += 'Invalid stock symbol format. Use format: NSE_EQ|ISIN_CODE (e.g., NSE_EQ|INE002A01018)';
      } else if (error.message?.includes('Rate limit')) {
        errorMessage += 'Too many requests. Please try again in a minute.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
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

    // Extract prices and volumes
    const prices = historicalData.map((candle) => candle.close);
    const volumes = historicalData.map((candle) => candle.volume);
    const highs = historicalData.map((candle) => candle.high);
    const lows = historicalData.map((candle) => candle.low);

    // Generate trading signal
    const signal = generateSignal(prices, volumes, highs, lows);

    const result = {
      symbol,
      signal,
      timestamp: new Date(),
      dataPoints: historicalData.length,
    };

    // Cache for 15 minutes
    await setCachedData(cacheKey, result, 900);

    // Store in MongoDB
    try {
      const { db } = await connectToDatabase();
      await db.collection('signals').insertOne({
        ...result,
        createdAt: new Date(),
      });
    } catch (dbError) {
      console.error('MongoDB insert error:', dbError);
      // Continue even if DB insert fails
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Signal generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate signal' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    // Limit to 10 symbols per request
    if (symbols.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 symbols allowed per request' },
        { status: 400 }
      );
    }

    const results = [];

    for (const symbol of symbols) {
      try {
        const cacheKey = `signal:${symbol}`;
        let signalData = await getCachedData(cacheKey);

        if (!signalData) {
          const today = new Date();
          const fromDate = new Date();
          fromDate.setDate(today.getDate() - 90);

          const formatDate = (date: Date) => date.toISOString().split('T')[0];

          const historicalData = await upstoxClient.getHistoricalData(
            symbol,
            'day',  // ✅ FIXED: Changed from '1day' to 'day'
            formatDate(fromDate),
            formatDate(today)
          );

          if (historicalData && historicalData.length > 0) {
            const prices = historicalData.map((candle) => candle.close);
            const volumes = historicalData.map((candle) => candle.volume);
            const highs = historicalData.map((candle) => candle.high);
            const lows = historicalData.map((candle) => candle.low);

            const signal = generateSignal(prices, volumes, highs, lows);

            signalData = {
              symbol,
              signal,
              timestamp: new Date(),
            };

            await setCachedData(cacheKey, signalData, 900);
          }
        }

        if (signalData) {
          results.push(signalData);
        }
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
      }
    }

    return NextResponse.json({ signals: results, count: results.length });
  } catch (error: any) {
    console.error('Batch signal generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate signals' },
      { status: 500 }
    );
  }
}