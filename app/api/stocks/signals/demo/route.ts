import { NextResponse } from 'next/server';

/**
 * Demo endpoint with mock data - for testing without Upstox API
 * Use this to test the app functionality while debugging Upstox connection
 */
export async function GET() {
  // Generate realistic mock data
  const generateMockCandles = (days: number) => {
    const candles = [];
    let basePrice = 2500;

    for (let i = 0; i < days; i++) {
      const variation = (Math.random() - 0.5) * 50;
      const open = basePrice;
      const close = basePrice + variation;
      const high = Math.max(open, close) + Math.random() * 20;
      const low = Math.min(open, close) - Math.random() * 20;
      const volume = Math.floor(1000000 + Math.random() * 5000000);

      candles.push({
        timestamp: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString(),
        open,
        high,
        low,
        close,
        volume,
      });

      basePrice = close;
    }

    return candles;
  };

  const mockCandles = generateMockCandles(90);
  const prices = mockCandles.map((c) => c.close);
  const volumes = mockCandles.map((c) => c.volume);

  // Calculate simple indicators
  const rsi = 45 + Math.random() * 20; // Random between 45-65
  const currentPrice = prices[prices.length - 1];

  const signal = {
    type: rsi < 50 ? 'BUY' : rsi > 60 ? 'SELL' : 'HOLD',
    confidence: 60 + Math.random() * 20,
    entryPrice: currentPrice,
    targetPrice: currentPrice * 1.06,
    stopLoss: currentPrice * 0.96,
    riskReward: 1.5,
    riskScore: {
      score: 35 + Math.random() * 30,
      level: 'MEDIUM',
      volatility: 12.5,
      volumeRatio: 1.2 + Math.random() * 0.8,
      priceDeviation: 3.2,
      breakdown: {
        volatilityRisk: 15,
        volumeRisk: 12,
        priceRisk: 8,
      },
    },
    indicators: {
      rsi,
      macd: {
        macd: 12.5,
        signal: 10.2,
        histogram: 2.3,
      },
      volumeRatio: 1.5,
    },
    reasons: [
      `RSI at ${rsi.toFixed(1)} indicates ${rsi < 50 ? 'oversold' : rsi > 60 ? 'overbought' : 'neutral'}`,
      'MACD showing bullish momentum',
      'Above average volume detected',
    ],
  };

  return NextResponse.json({
    symbol: 'DEMO_STOCK',
    signal,
    timestamp: new Date(),
    dataPoints: mockCandles.length,
    note: 'This is DEMO data. Configure Upstox API for real stock data.',
  });
}
