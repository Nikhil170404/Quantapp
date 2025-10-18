import { NextResponse } from 'next/server';
import { upstoxClient } from '@/lib/upstox/client';

export async function GET() {
  try {
    const testSymbol = 'NSE_EQ|INE002A01018'; // Reliance

    // Test 1: Try to get market quote
    let quoteTest = { success: false, error: '' };
    try {
      const quote = await upstoxClient.getMarketQuote([testSymbol]);
      quoteTest = { success: true, error: '' };
    } catch (error: any) {
      quoteTest = { success: false, error: error.message };
    }

    // Test 2: Try to get historical data (last 7 days)
    let historicalTest = { success: false, error: '', dataPoints: 0 };
    try {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      const data = await upstoxClient.getHistoricalData(
        testSymbol,
        '1day',
        formatDate(weekAgo),
        formatDate(today)
      );

      historicalTest = {
        success: true,
        error: '',
        dataPoints: data.length,
      };
    } catch (error: any) {
      historicalTest = {
        success: false,
        error: error.message,
        dataPoints: 0,
      };
    }

    return NextResponse.json({
      upstoxApi: {
        configured: !!process.env.UPSTOX_ACCESS_TOKEN,
        tokenPresent: !!process.env.UPSTOX_ACCESS_TOKEN,
      },
      tests: {
        marketQuote: quoteTest,
        historicalData: historicalTest,
      },
      recommendations: [
        !quoteTest.success && quoteTest.error.includes('401')
          ? 'Access token expired or invalid. Generate new token from Upstox developer portal.'
          : '',
        !historicalTest.success && historicalTest.error.includes('400')
          ? 'Symbol format or date range invalid. Check Upstox API documentation.'
          : '',
        historicalTest.success && historicalTest.dataPoints === 0
          ? 'API working but no data returned. Market might be closed.'
          : '',
      ].filter(Boolean),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        details: 'Upstox API test failed',
      },
      { status: 500 }
    );
  }
}
