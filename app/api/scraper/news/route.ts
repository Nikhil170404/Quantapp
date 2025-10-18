import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getCachedData, setCachedData } from '@/lib/cache/simple-cache';
import { newsScraper } from '@/lib/scraper/news';
import { getStockInfo } from '@/lib/constants/nifty50';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Rate limiting (stricter for scraping)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const allowed = await checkRateLimit(ip, 50, 60000);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Check cache
    const cacheKey = `news:${symbol}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get stock info for better search terms
    const stockInfo = getStockInfo(symbol);
    let searchQuery = symbol;
    let searchTerms: string[] | undefined;

    if (stockInfo) {
      // Use company name for better news results
      searchQuery = stockInfo.name;
      searchTerms = stockInfo.searchTerms;
    }

    // Scrape news with sentiment using proper company name
    const news = await newsScraper.getNewsWithSentiment(
      searchQuery,
      maxResults,
      searchTerms
    );

    // Calculate overall sentiment
    const totalSentiment = news.reduce((sum, item) => sum + item.sentimentScore, 0);
    const avgSentiment = news.length > 0 ? totalSentiment / news.length : 0;

    let overallSentiment: 'positive' | 'negative' | 'neutral';
    if (avgSentiment > 0.2) overallSentiment = 'positive';
    else if (avgSentiment < -0.2) overallSentiment = 'negative';
    else overallSentiment = 'neutral';

    const result = {
      symbol,
      companyName: stockInfo?.name || symbol,
      shortName: stockInfo?.shortName || symbol,
      sector: stockInfo?.sector,
      news,
      count: news.length,
      overallSentiment,
      avgSentimentScore: Number(avgSentiment.toFixed(2)),
      timestamp: new Date(),
    };

    // Cache for 30 minutes
    await setCachedData(cacheKey, result, 1800);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('News scraping error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}