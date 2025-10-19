/**
 * Stochastic Oscillator
 * 
 * Momentum indicator comparing closing price to price range
 * - %K: Fast stochastic
 * - %D: Slow stochastic (MA of %K)
 * 
 * Signals:
 * - Above 80: Overbought
 * - Below 20: Oversold
 * - Crossovers: Trading signals
 */

export interface StochasticResult {
  k: number; // %K (fast)
  d: number; // %D (slow)
  signal: 'overbought' | 'oversold' | 'neutral';
}

/**
 * Calculate Stochastic Oscillator
 * 
 * @param highs Array of high prices
 * @param lows Array of low prices
 * @param closes Array of closing prices
 * @param kPeriod %K period (default: 14)
 * @param dPeriod %D period (default: 3)
 * @returns Stochastic result
 */
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticResult {
  if (closes.length < kPeriod + dPeriod) {
    return { k: 50, d: 50, signal: 'neutral' };
  }

  // Calculate %K values
  const kValues: number[] = [];
  
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const recentHighs = highs.slice(i - kPeriod + 1, i + 1);
    const recentLows = lows.slice(i - kPeriod + 1, i + 1);
    
    const highest = Math.max(...recentHighs);
    const lowest = Math.min(...recentLows);
    const close = closes[i];
    
    const k = ((close - lowest) / (highest - lowest)) * 100;
    kValues.push(k);
  }

  // Calculate %D (SMA of %K)
  const dValues: number[] = [];
  
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    const slice = kValues.slice(i - dPeriod + 1, i + 1);
    const d = slice.reduce((a, b) => a + b, 0) / dPeriod;
    dValues.push(d);
  }

  const currentK = kValues[kValues.length - 1];
  const currentD = dValues[dValues.length - 1];

  // Determine signal
  let signal: 'overbought' | 'oversold' | 'neutral';
  if (currentK > 80 && currentD > 80) {
    signal = 'overbought';
  } else if (currentK < 20 && currentD < 20) {
    signal = 'oversold';
  } else {
    signal = 'neutral';
  }

  return {
    k: Number(currentK.toFixed(2)),
    d: Number(currentD.toFixed(2)),
    signal,
  };
}

/**
 * Get Stochastic trading signal
 */
export function getStochasticSignal(stoch: StochasticResult): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  reason: string;
} {
  const { k, d, signal } = stoch;

  // Oversold + %K crosses above %D
  if (signal === 'oversold' && k > d) {
    return {
      signal: 'BUY',
      strength: (20 - Math.min(k, d)) * 5, // 0-100 scale
      reason: `Oversold crossover (%K: ${k}, %D: ${d}) - reversal likely`,
    };
  }

  // Overbought + %K crosses below %D
  if (signal === 'overbought' && k < d) {
    return {
      signal: 'SELL',
      strength: (Math.max(k, d) - 80) * 5, // 0-100 scale
      reason: `Overbought crossover (%K: ${k}, %D: ${d}) - correction likely`,
    };
  }

  // Just oversold (not crossed yet)
  if (signal === 'oversold') {
    return {
      signal: 'BUY',
      strength: 30,
      reason: `Oversold condition (%K: ${k}) - watch for reversal`,
    };
  }

  // Just overbought
  if (signal === 'overbought') {
    return {
      signal: 'SELL',
      strength: 30,
      reason: `Overbought condition (%K: ${k}) - watch for pullback`,
    };
  }

  return {
    signal: 'HOLD',
    strength: 0,
    reason: `Neutral zone (%K: ${k}, %D: ${d})`,
  };
}

/**
 * Detect Stochastic crossover
 */
export function detectStochasticCrossover(
  current: StochasticResult,
  previous: StochasticResult
): 'bullish' | 'bearish' | null {
  // Bullish: %K crosses above %D
  if (current.k > current.d && previous.k <= previous.d) {
    return 'bullish';
  }

  // Bearish: %K crosses below %D
  if (current.k < current.d && previous.k >= previous.d) {
    return 'bearish';
  }

  return null;
}

/**
 * Detect divergence between price and Stochastic
 */
export function detectStochasticDivergence(
  prices: number[],
  stochValues: StochasticResult[],
  lookback: number = 14
): 'bullish' | 'bearish' | null {
  if (prices.length < lookback || stochValues.length < lookback) {
    return null;
  }

  const recentPrices = prices.slice(-lookback);
  const recentStoch = stochValues.slice(-lookback);

  const priceStart = recentPrices[0];
  const priceEnd = recentPrices[recentPrices.length - 1];
  const stochStart = recentStoch[0].k;
  const stochEnd = recentStoch[recentStoch.length - 1].k;

  // Bullish divergence: Price making lower lows, Stochastic making higher lows
  if (priceEnd < priceStart && stochEnd > stochStart) {
    return 'bullish';
  }

  // Bearish divergence: Price making higher highs, Stochastic making lower highs
  if (priceEnd > priceStart && stochEnd < stochStart) {
    return 'bearish';
  }

  return null;
}