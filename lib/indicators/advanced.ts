/**
 * Advanced Technical Indicators Collection
 * 
 * - VWAP (Volume Weighted Average Price)
 * - Fibonacci Retracements
 * - Ichimoku Cloud
 * - SuperTrend
 * - Parabolic SAR
 */

// ==================== VWAP ====================

export interface VWAPResult {
  vwap: number;
  signal: 'above' | 'below' | 'at';
  distance: number; // % from VWAP
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 * Used by institutions - price tends to revert to VWAP
 */
export function calculateVWAP(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[]
): VWAPResult {
  if (closes.length === 0) {
    return { vwap: 0, signal: 'at', distance: 0 };
  }

  let cumulativePV = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    cumulativePV += typicalPrice * volumes[i];
    cumulativeVolume += volumes[i];
  }

  const vwap = cumulativeVolume === 0 ? 0 : cumulativePV / cumulativeVolume;
  const currentPrice = closes[closes.length - 1];
  const distance = ((currentPrice - vwap) / vwap) * 100;

  let signal: 'above' | 'below' | 'at';
  if (currentPrice > vwap * 1.002) signal = 'above';
  else if (currentPrice < vwap * 0.998) signal = 'below';
  else signal = 'at';

  return {
    vwap: Number(vwap.toFixed(2)),
    signal,
    distance: Number(distance.toFixed(2)),
  };
}

// ==================== FIBONACCI ====================

export interface FibonacciLevels {
  high: number;
  low: number;
  levels: {
    [key: string]: number;
  };
}

/**
 * Calculate Fibonacci Retracement Levels
 */
export function calculateFibonacci(
  prices: number[],
  lookback: number = 50
): FibonacciLevels {
  const recentPrices = prices.slice(-lookback);
  const high = Math.max(...recentPrices);
  const low = Math.min(...recentPrices);
  const range = high - low;

  const fibRatios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const levels: { [key: string]: number } = {};

  fibRatios.forEach((ratio) => {
    levels[`${(ratio * 100).toFixed(1)}%`] = Number(
      (high - range * ratio).toFixed(2)
    );
  });

  return { high, low, levels };
}

// ==================== SUPERTREND ====================

export interface SuperTrendResult {
  supertrend: number;
  direction: 'up' | 'down';
  signal: 'BUY' | 'SELL' | 'HOLD';
}

/**
 * Calculate SuperTrend
 * Combines ATR with price action
 */
export function calculateSuperTrend(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 10,
  multiplier: number = 3
): SuperTrendResult {
  if (closes.length < period + 1) {
    return { supertrend: 0, direction: 'up', signal: 'HOLD' };
  }

  // Calculate ATR
  const trueRanges: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }

  // Calculate basic bands
  const hl2 = (highs[highs.length - 1] + lows[lows.length - 1]) / 2;
  const upperBand = hl2 + (multiplier * atr);
  const lowerBand = hl2 - (multiplier * atr);

  const currentPrice = closes[closes.length - 1];
  
  // Determine trend
  const direction = currentPrice > upperBand ? 'up' : 'down';
  const supertrend = direction === 'up' ? lowerBand : upperBand;
  
  // Generate signal
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  if (currentPrice > supertrend && direction === 'up') {
    signal = 'BUY';
  } else if (currentPrice < supertrend && direction === 'down') {
    signal = 'SELL';
  }

  return {
    supertrend: Number(supertrend.toFixed(2)),
    direction,
    signal,
  };
}

// ==================== ICHIMOKU CLOUD ====================

export interface IchimokuResult {
  tenkan: number; // Conversion line
  kijun: number; // Base line
  senkouA: number; // Leading span A
  senkouB: number; // Leading span B
  chikou: number; // Lagging span
  signal: 'bullish' | 'bearish' | 'neutral';
  cloudThickness: number;
}

/**
 * Calculate Ichimoku Cloud
 */
export function calculateIchimoku(
  highs: number[],
  lows: number[],
  closes: number[]
): IchimokuResult {
  const tenkanPeriod = 9;
  const kijunPeriod = 26;
  const senkouBPeriod = 52;

  if (closes.length < senkouBPeriod) {
    return {
      tenkan: 0,
      kijun: 0,
      senkouA: 0,
      senkouB: 0,
      chikou: 0,
      signal: 'neutral',
      cloudThickness: 0,
    };
  }

  // Tenkan-sen (Conversion Line): (9-period high + 9-period low)/2
  const tenkanHigh = Math.max(...highs.slice(-tenkanPeriod));
  const tenkanLow = Math.min(...lows.slice(-tenkanPeriod));
  const tenkan = (tenkanHigh + tenkanLow) / 2;

  // Kijun-sen (Base Line): (26-period high + 26-period low)/2
  const kijunHigh = Math.max(...highs.slice(-kijunPeriod));
  const kijunLow = Math.min(...lows.slice(-kijunPeriod));
  const kijun = (kijunHigh + kijunLow) / 2;

  // Senkou Span A (Leading Span A): (Conversion Line + Base Line)/2
  const senkouA = (tenkan + kijun) / 2;

  // Senkou Span B (Leading Span B): (52-period high + 52-period low)/2
  const senkouBHigh = Math.max(...highs.slice(-senkouBPeriod));
  const senkouBLow = Math.min(...lows.slice(-senkouBPeriod));
  const senkouB = (senkouBHigh + senkouBLow) / 2;

  // Chikou Span (Lagging Span): Close plotted 26 periods in the past
  const chikou = closes[closes.length - kijunPeriod] || closes[0];

  const currentPrice = closes[closes.length - 1];
  const cloudThickness = Math.abs(senkouA - senkouB);

  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  // Price above cloud and Tenkan above Kijun
  if (
    currentPrice > Math.max(senkouA, senkouB) &&
    tenkan > kijun
  ) {
    signal = 'bullish';
  }
  // Price below cloud and Tenkan below Kijun
  else if (
    currentPrice < Math.min(senkouA, senkouB) &&
    tenkan < kijun
  ) {
    signal = 'bearish';
  }

  return {
    tenkan: Number(tenkan.toFixed(2)),
    kijun: Number(kijun.toFixed(2)),
    senkouA: Number(senkouA.toFixed(2)),
    senkouB: Number(senkouB.toFixed(2)),
    chikou: Number(chikou.toFixed(2)),
    signal,
    cloudThickness: Number(cloudThickness.toFixed(2)),
  };
}

// ==================== PARABOLIC SAR ====================

export interface ParabolicSARResult {
  sar: number;
  trend: 'up' | 'down';
  signal: 'BUY' | 'SELL' | 'HOLD';
}

/**
 * Calculate Parabolic SAR (Stop and Reverse)
 */
export function calculateParabolicSAR(
  highs: number[],
  lows: number[],
  closes: number[],
  acceleration: number = 0.02,
  maximum: number = 0.2
): ParabolicSARResult {
  if (closes.length < 2) {
    return { sar: 0, trend: 'up', signal: 'HOLD' };
  }

  let trend = closes[1] > closes[0] ? 'up' : 'down';
  let sar = trend === 'up' ? lows[0] : highs[0];
  let ep = trend === 'up' ? highs[1] : lows[1]; // Extreme point
  let af = acceleration;

  // Calculate SAR for last period
  for (let i = 2; i < closes.length; i++) {
    const prevSar = sar;
    
    // Calculate new SAR
    sar = prevSar + af * (ep - prevSar);
    
    // Check for trend reversal
    if (trend === 'up') {
      if (lows[i] < sar) {
        // Reversal to downtrend
        trend = 'down';
        sar = ep;
        ep = lows[i];
        af = acceleration;
      } else {
        // Continue uptrend
        if (highs[i] > ep) {
          ep = highs[i];
          af = Math.min(af + acceleration, maximum);
        }
      }
    } else {
      if (highs[i] > sar) {
        // Reversal to uptrend
        trend = 'up';
        sar = ep;
        ep = highs[i];
        af = acceleration;
      } else {
        // Continue downtrend
        if (lows[i] < ep) {
          ep = lows[i];
          af = Math.min(af + acceleration, maximum);
        }
      }
    }
  }

  const currentPrice = closes[closes.length - 1];
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  
  if (trend === 'up' && currentPrice > sar) {
    signal = 'BUY';
  } else if (trend === 'down' && currentPrice < sar) {
    signal = 'SELL';
  }

  return {
    sar: Number(sar.toFixed(2)),
    trend: trend as 'up' | 'down',
    signal,
  };
}