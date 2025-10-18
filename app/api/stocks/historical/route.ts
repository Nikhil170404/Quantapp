import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getCachedData, setCachedData } from '@/lib/cache/simple-cache';
import { upstoxClient } from '@/lib/upstox/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1day';
    const days = parseInt(searchParams.get('days') || '90');

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

    // Check cache
    const cacheKey = `historical:${symbol}:${interval}:${days}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Calculate date range
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Fetch from Upstox
    const data = await upstoxClient.getHistoricalData(
      symbol,
      interval,
      formatDate(fromDate),
      formatDate(toDate)
    );

    const result = {
      symbol,
      interval,
      data,
      count: data.length,
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
    };

    // Cache for 1 hour for daily data, 15 minutes for intraday
    const cacheTTL = interval === '1day' ? 3600 : 900;
    await setCachedData(cacheKey, result, cacheTTL);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Historical data error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
