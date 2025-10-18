/**
 * Bollinger Bands Indicator
 * 
 * Bollinger Bands measure volatility and potential price levels
 * 
 * Components:
 * - Middle Band: Simple Moving Average (SMA)
 * - Upper Band: SMA + (2 * Standard Deviation)
 * - Lower Band: SMA - (2 * Standard Deviation)
 * - %B: Shows where price is relative to bands (0 = lower band, 1 = upper band)
 * - Bandwidth: Measures band width (volatility)
 * 
 * Trading Signals:
 * - Price near lower band (< 0.2): Oversold - potential buy
 * - Price near upper band (> 0.8): Overbought - potential sell
 * - Price at middle band (0.4-0.6): Neutral
 * - Bands squeeze (low bandwidth): Volatility breakout coming
 * - Bands widen (high bandwidth): High volatility period
 */

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  percentB: number; // Where price is relative to bands (0-1)
  bandwidth: number; // Width of bands (volatility measure)
}

/**
 * Calculate Standard Deviation
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  
  const variance = values.reduce((sum, val) => {
    return sum + Math.pow(val - mean, 2);
  }, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(values: number[], period: number): number {
  if (values.length < period) return 0;
  
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate Bollinger Bands
 * 
 * @param prices Array of closing prices
 * @param period SMA period (default: 20)
 * @param stdDevMultiplier Standard deviation multiplier (default: 2)
 * @returns Bollinger Bands values
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands {
  if (prices.length < period) {
    return {
      upper: 0,
      middle: 0,
      lower: 0,
      percentB: 0.5,
      bandwidth: 0,
    };
  }

  const currentPrice = prices[prices.length - 1];
  const recentPrices = prices.slice(-period);
  
  // Calculate Middle Band (SMA)
  const middle = calculateSMA(prices, period);
  
  // Calculate Standard Deviation
  const stdDev = calculateStdDev(recentPrices, middle);
  
  // Calculate Upper and Lower Bands
  const upper = middle + (stdDevMultiplier * stdDev);
  const lower = middle - (stdDevMultiplier * stdDev);
  
  // Calculate %B (where price is relative to bands)
  // %B = (Price - Lower Band) / (Upper Band - Lower Band)
  const percentB = (upper - lower) !== 0 
    ? (currentPrice - lower) / (upper - lower)
    : 0.5;
  
  // Calculate Bandwidth (volatility measure)
  // Bandwidth = (Upper Band - Lower Band) / Middle Band
  const bandwidth = middle !== 0
    ? ((upper - lower) / middle) * 100
    : 0;

  return {
    upper: Number(upper.toFixed(2)),
    middle: Number(middle.toFixed(2)),
    lower: Number(lower.toFixed(2)),
    percentB: Number(percentB.toFixed(3)),
    bandwidth: Number(bandwidth.toFixed(2)),
  };
}

/**
 * Calculate Bollinger Bands for all periods (returns array)
 */
export function calculateBollingerBandsArray(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands[] {
  const results: BollingerBands[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    results.push(calculateBollingerBands(slice, period, stdDevMultiplier));
  }
  
  return results;
}

/**
 * Get Bollinger Bands signal
 */
export function getBollingerSignal(bands: BollingerBands): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  reason: string;
} {
  const { percentB, bandwidth } = bands;
  
  // Squeeze detection (low volatility - potential breakout)
  const isSqueeze = bandwidth < 10;
  
  // Price near lower band (oversold)
  if (percentB < 0.2) {
    return {
      signal: 'BUY',
      strength: (0.2 - percentB) * 500, // 0-100 scale
      reason: `Price near lower Bollinger Band (%B: ${(percentB * 100).toFixed(0)}%) - Oversold${isSqueeze ? ', Squeeze detected' : ''}`,
    };
  }
  
  // Price near upper band (overbought)
  if (percentB > 0.8) {
    return {
      signal: 'SELL',
      strength: (percentB - 0.8) * 500, // 0-100 scale
      reason: `Price near upper Bollinger Band (%B: ${(percentB * 100).toFixed(0)}%) - Overbought${isSqueeze ? ', Squeeze detected' : ''}`,
    };
  }
  
  // Price in middle (neutral)
  return {
    signal: 'HOLD',
    strength: 0,
    reason: `Price in middle Bollinger Band (%B: ${(percentB * 100).toFixed(0)}%) - Neutral${isSqueeze ? ', Potential breakout soon' : ''}`,
  };
}

/**
 * Detect Bollinger Squeeze (low volatility period)
 */
export function detectBollingerSqueeze(
  bands: BollingerBands[],
  lookbackPeriod: number = 20
): boolean {
  if (bands.length < lookbackPeriod) return false;
  
  const recentBands = bands.slice(-lookbackPeriod);
  const currentBandwidth = bands[bands.length - 1].bandwidth;
  
  // Check if current bandwidth is in the lowest 20% of recent bandwidths
  const sortedBandwidths = recentBands
    .map(b => b.bandwidth)
    .sort((a, b) => a - b);
  
  const threshold = sortedBandwidths[Math.floor(sortedBandwidths.length * 0.2)];
  
  return currentBandwidth <= threshold;
}

/**
 * Calculate Bollinger Band Width Percentile
 * Shows where current bandwidth ranks historically
 */
export function calculateBandwidthPercentile(
  currentBandwidth: number,
  historicalBandwidths: number[]
): number {
  if (historicalBandwidths.length === 0) return 50;
  
  const sorted = [...historicalBandwidths].sort((a, b) => a - b);
  const position = sorted.filter(b => b < currentBandwidth).length;
  
  return (position / sorted.length) * 100;
}