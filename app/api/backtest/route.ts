import { NextRequest, NextResponse } from 'next/server';
import { BacktestEngine, BacktestConfig, Signal } from '@/lib/backtesting/engine';
import { upstoxClient } from '@/lib/upstox/client';
import { generateComprehensiveSignal } from '@/lib/strategies/comprehensive';

/**
 * POST /api/backtest
 * 
 * Backtest a trading strategy
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, startDate, endDate, config } = body;

    if (!symbol || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'symbol, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Fetch historical data
    console.log(`Backtesting ${symbol} from ${startDate} to ${endDate}`);
    
    const historicalData = await upstoxClient.getHistoricalData(
      symbol,
      'day',
      startDate,
      endDate
    );

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json(
        { error: 'No historical data found for the given period' },
        { status: 404 }
      );
    }

    // Transform data format
    const formattedData = historicalData.map((candle) => ({
      date: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }));

    // Generate signals for each day
    console.log('Generating trading signals...');
    const signals: Signal[] = [];

    for (let i = 50; i < formattedData.length; i++) {
      const prices = formattedData.slice(0, i + 1).map((d) => d.close);
      const volumes = formattedData.slice(0, i + 1).map((d) => d.volume);
      const highs = formattedData.slice(0, i + 1).map((d) => d.high);
      const lows = formattedData.slice(0, i + 1).map((d) => d.low);
      const opens = formattedData.slice(0, i + 1).map((d) => d.open);

      try {
        const analysis = generateComprehensiveSignal(prices, volumes, highs, lows, opens);

        if (analysis.signal.type !== 'HOLD') {
          signals.push({
            date: formattedData[i].date,
            type: analysis.signal.type,
            price: formattedData[i].close,
            stopLoss: analysis.signal.stopLoss,
            target: analysis.signal.targetPrice,
            confidence: analysis.signal.confidence,
          });
        }
      } catch (error) {
        // Skip if not enough data
        continue;
      }
    }

    console.log(`Generated ${signals.length} signals`);

    // Configure backtest
    const backtestConfig: BacktestConfig = {
      initialCapital: config?.initialCapital || 100000,
      commission: config?.commission || 0.001, // 0.1%
      slippage: config?.slippage || 0.001, // 0.1%
      positionSizing: config?.positionSizing || 'atr',
      positionSizeValue: config?.positionSizeValue || 2, // 2% risk per trade
      maxPositions: config?.maxPositions || 1,
      riskPerTrade: config?.riskPerTrade || 1, // 1% risk
    };

    // Run backtest
    console.log('Running backtest...');
    const engine = new BacktestEngine(backtestConfig);
    const results = engine.run(formattedData, signals);

    console.log('Backtest complete!');
    console.log(`Total trades: ${results.metrics.totalTrades}`);
    console.log(`Win rate: ${results.metrics.winRate.toFixed(2)}%`);
    console.log(`Total return: ${results.metrics.totalReturnPercent.toFixed(2)}%`);
    console.log(`Max drawdown: ${results.metrics.maxDrawdownPercent.toFixed(2)}%`);
    console.log(`Sharpe ratio: ${results.metrics.sharpeRatio}`);

    return NextResponse.json({
      success: true,
      symbol,
      period: {
        start: startDate,
        end: endDate,
        days: formattedData.length,
      },
      config: backtestConfig,
      results: {
        metrics: results.metrics,
        trades: results.trades,
        equity: results.equity,
        dates: results.dates,
      },
    });
  } catch (error: any) {
    console.error('Backtest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run backtest' },
      { status: 500 }
    );
  }
}