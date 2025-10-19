/**
 * ATR (Average True Range) Indicator
 * 
 * Measures market volatility - CRITICAL for:
 * - Dynamic position sizing
 * - Stop loss placement
 * - Volatility-based exits
 * 
 * Uses Wilder's smoothing method
 */

export interface ATRResult {
  atr: number;
  tr: number; // Current True Range
  atrPercent: number; // ATR as % of price
}

/**
 * Calculate True Range for a single period
 */
function calculateTrueRange(
  high: number,
  low: number,
  prevClose: number
): number {
  const method1 = high - low;
  const method2 = Math.abs(high - prevClose);
  const method3 = Math.abs(low - prevClose);
  
  return Math.max(method1, method2, method3);
}

/**
 * Calculate ATR (Average True Range)
 * 
 * @param highs Array of high prices
 * @param lows Array of low prices
 * @param closes Array of closing prices
 * @param period ATR period (default: 14)
 * @returns ATR result
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): ATRResult {
  if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
    return { atr: 0, tr: 0, atrPercent: 0 };
  }

  const trueRanges: number[] = [];

  // Calculate True Range for each period
  for (let i = 1; i < closes.length; i++) {
    const tr = calculateTrueRange(highs[i], lows[i], closes[i - 1]);
    trueRanges.push(tr);
  }

  // Calculate initial ATR (simple average of first N TRs)
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Smooth using Wilder's method
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }

  const currentTR = trueRanges[trueRanges.length - 1];
  const currentPrice = closes[closes.length - 1];
  const atrPercent = (atr / currentPrice) * 100;

  return {
    atr: Number(atr.toFixed(2)),
    tr: Number(currentTR.toFixed(2)),
    atrPercent: Number(atrPercent.toFixed(2)),
  };
}

/**
 * Calculate ATR array for all periods
 */
export function calculateATRArray(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): ATRResult[] {
  const results: ATRResult[] = [];
  
  for (let i = period; i < closes.length; i++) {
    const sliceHighs = highs.slice(0, i + 1);
    const sliceLows = lows.slice(0, i + 1);
    const sliceCloses = closes.slice(0, i + 1);
    
    results.push(calculateATR(sliceHighs, sliceLows, sliceCloses, period));
  }
  
  return results;
}

/**
 * Calculate ATR-based stop loss
 * 
 * @param entryPrice Entry price
 * @param atr Current ATR value
 * @param multiplier ATR multiplier (default: 2)
 * @param direction 'long' or 'short'
 * @returns Stop loss price
 */
export function calculateATRStopLoss(
  entryPrice: number,
  atr: number,
  multiplier: number = 2,
  direction: 'long' | 'short' = 'long'
): number {
  const stopDistance = atr * multiplier;
  
  if (direction === 'long') {
    return Number((entryPrice - stopDistance).toFixed(2));
  } else {
    return Number((entryPrice + stopDistance).toFixed(2));
  }
}

/**
 * Calculate ATR-based position size
 * 
 * @param accountSize Total account size
 * @param riskPercent Risk per trade (e.g., 1 for 1%)
 * @param entryPrice Entry price
 * @param atr Current ATR
 * @param atrMultiplier ATR multiplier for stop
 * @returns Number of shares to buy
 */
export function calculateATRPositionSize(
  accountSize: number,
  riskPercent: number,
  entryPrice: number,
  atr: number,
  atrMultiplier: number = 2
): number {
  const riskAmount = accountSize * (riskPercent / 100);
  const stopDistance = atr * atrMultiplier;
  const shares = Math.floor(riskAmount / stopDistance);
  
  return shares;
}

/**
 * Detect volatility regime using ATR
 */
export function detectVolatilityRegime(
  atrPercent: number
): 'low' | 'normal' | 'high' | 'extreme' {
  if (atrPercent < 1.5) return 'low';
  if (atrPercent < 3) return 'normal';
  if (atrPercent < 5) return 'high';
  return 'extreme';
}