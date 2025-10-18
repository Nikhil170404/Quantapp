/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];

  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]];

  for (let i = 1; i < prices.length; i++) {
    const value = prices[i] * k + ema[i - 1] * (1 - k);
    ema.push(value);
  }

  return ema;
}

/**
 * MACD (Moving Average Convergence Divergence) Result
 */
export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * Calculate MACD indicator
 *
 * MACD measures trend direction and momentum
 *
 * Interpretation:
 * - MACD > Signal: Bullish (buy signal)
 * - MACD < Signal: Bearish (sell signal)
 * - Histogram > 0: Bullish momentum
 * - Histogram < 0: Bearish momentum
 *
 * @param prices Array of closing prices
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line period (default: 9)
 * @returns MACD result object
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (prices.length < slowPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  // Calculate EMAs
  const ema12 = calculateEMA(prices, fastPeriod);
  const ema26 = calculateEMA(prices, slowPeriod);

  // Calculate MACD line
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];

  // Calculate MACD values for signal line
  const macdValues = ema12.map((val, i) => val - ema26[i]);

  // Calculate signal line (9-day EMA of MACD)
  const signalLine = calculateEMA(macdValues, signalPeriod);
  const signal = signalLine[signalLine.length - 1];

  // Calculate histogram
  const histogram = macdLine - signal;

  return {
    macd: Number(macdLine.toFixed(2)),
    signal: Number(signal.toFixed(2)),
    histogram: Number(histogram.toFixed(2)),
  };
}

/**
 * Calculate MACD for all periods (returns arrays)
 */
export function calculateMACDArray(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult[] {
  const results: MACDResult[] = [];

  const ema12 = calculateEMA(prices, fastPeriod);
  const ema26 = calculateEMA(prices, slowPeriod);
  const macdValues = ema12.map((val, i) => val - ema26[i]);
  const signalLine = calculateEMA(macdValues, signalPeriod);

  for (let i = 0; i < prices.length; i++) {
    results.push({
      macd: Number(macdValues[i]?.toFixed(2) || 0),
      signal: Number(signalLine[i]?.toFixed(2) || 0),
      histogram: Number((macdValues[i] - signalLine[i])?.toFixed(2) || 0),
    });
  }

  return results;
}

/**
 * Get MACD signal
 */
export function getMACDSignal(macd: MACDResult): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  reason: string;
} {
  const { macd: macdValue, signal, histogram } = macd;

  // Bullish crossover
  if (macdValue > signal && histogram > 0) {
    return {
      signal: 'BUY',
      strength: Math.min(Math.abs(histogram) * 10, 100),
      reason: `MACD bullish crossover (${histogram.toFixed(2)})`,
    };
  }

  // Bearish crossover
  if (macdValue < signal && histogram < 0) {
    return {
      signal: 'SELL',
      strength: Math.min(Math.abs(histogram) * 10, 100),
      reason: `MACD bearish crossover (${histogram.toFixed(2)})`,
    };
  }

  return {
    signal: 'HOLD',
    strength: 0,
    reason: `MACD neutral (${histogram.toFixed(2)})`,
  };
}

/**
 * Detect MACD crossover
 */
export function detectMACDCrossover(
  current: MACDResult,
  previous: MACDResult
): 'bullish' | 'bearish' | null {
  // Bullish crossover: MACD crosses above signal
  if (current.macd > current.signal && previous.macd <= previous.signal) {
    return 'bullish';
  }

  // Bearish crossover: MACD crosses below signal
  if (current.macd < current.signal && previous.macd >= previous.signal) {
    return 'bearish';
  }

  return null;
}
