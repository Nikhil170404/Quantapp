/**
 * Calculate Relative Strength Index (RSI)
 * RSI measures momentum and identifies overbought/oversold conditions
 *
 * Interpretation:
 * - RSI > 70: Overbought (potential sell signal)
 * - RSI < 30: Oversold (potential buy signal)
 * - RSI 30-70: Neutral zone
 *
 * @param prices Array of closing prices
 * @param period RSI period (default: 14)
 * @returns RSI value (0-100)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Return neutral if insufficient data
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate subsequent averages using Wilder's smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  // Calculate RSI
  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Number(rsi.toFixed(2));
}

/**
 * Calculate RSI for all periods (returns array)
 */
export function calculateRSIArray(prices: number[], period: number = 14): number[] {
  const rsiValues: number[] = [];

  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    rsiValues.push(calculateRSI(slice, period));
  }

  return rsiValues;
}

/**
 * Get RSI signal
 */
export function getRSISignal(rsi: number): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  reason: string;
} {
  if (rsi < 30) {
    return {
      signal: 'BUY',
      strength: (30 - rsi) / 30 * 100,
      reason: `RSI oversold at ${rsi.toFixed(2)}`,
    };
  } else if (rsi > 70) {
    return {
      signal: 'SELL',
      strength: (rsi - 70) / 30 * 100,
      reason: `RSI overbought at ${rsi.toFixed(2)}`,
    };
  }

  return {
    signal: 'HOLD',
    strength: 0,
    reason: `RSI neutral at ${rsi.toFixed(2)}`,
  };
}
