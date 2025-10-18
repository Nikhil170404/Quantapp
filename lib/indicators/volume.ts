/**
 * Volume Analysis Indicators
 */

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(values: number[], period: number): number {
  if (values.length < period) return 0;

  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculate Volume Moving Average
 */
export function calculateVolumeMA(volumes: number[], period: number = 20): number {
  return calculateSMA(volumes, period);
}

/**
 * Calculate Volume Ratio (current volume / average volume)
 */
export function calculateVolumeRatio(volumes: number[], period: number = 20): number {
  if (volumes.length < period) return 1;

  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = calculateVolumeMA(volumes, period);

  if (avgVolume === 0) return 1;

  return Number((currentVolume / avgVolume).toFixed(2));
}

/**
 * Detect volume spike
 */
export function detectVolumeSpike(
  volumes: number[],
  threshold: number = 2.0,
  period: number = 20
): boolean {
  const volumeRatio = calculateVolumeRatio(volumes, period);
  return volumeRatio >= threshold;
}

/**
 * Calculate On-Balance Volume (OBV)
 */
export function calculateOBV(prices: number[], volumes: number[]): number[] {
  const obv: number[] = [volumes[0]];

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      obv.push(obv[i - 1] + volumes[i]);
    } else if (prices[i] < prices[i - 1]) {
      obv.push(obv[i - 1] - volumes[i]);
    } else {
      obv.push(obv[i - 1]);
    }
  }

  return obv;
}

/**
 * Calculate Volume-Weighted Average Price (VWAP)
 */
export function calculateVWAP(
  prices: number[],
  volumes: number[],
  highs?: number[],
  lows?: number[]
): number {
  if (prices.length === 0 || volumes.length === 0) return 0;

  let totalPV = 0;
  let totalVolume = 0;

  for (let i = 0; i < prices.length; i++) {
    // Typical Price = (High + Low + Close) / 3
    const typicalPrice = highs && lows
      ? (highs[i] + lows[i] + prices[i]) / 3
      : prices[i];

    totalPV += typicalPrice * volumes[i];
    totalVolume += volumes[i];
  }

  if (totalVolume === 0) return 0;

  return Number((totalPV / totalVolume).toFixed(2));
}

/**
 * Get volume signal
 */
export function getVolumeSignal(
  volumes: number[],
  prices: number[],
  period: number = 20
): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  reason: string;
  volumeRatio: number;
} {
  const volumeRatio = calculateVolumeRatio(volumes, period);
  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];
  const priceUp = currentPrice > previousPrice;

  // High volume breakout (bullish)
  if (volumeRatio >= 2.0 && priceUp) {
    return {
      signal: 'BUY',
      strength: Math.min((volumeRatio - 1) * 50, 100),
      reason: `High volume breakout (${volumeRatio.toFixed(2)}x avg)`,
      volumeRatio,
    };
  }

  // High volume breakdown (bearish)
  if (volumeRatio >= 2.0 && !priceUp) {
    return {
      signal: 'SELL',
      strength: Math.min((volumeRatio - 1) * 50, 100),
      reason: `High volume breakdown (${volumeRatio.toFixed(2)}x avg)`,
      volumeRatio,
    };
  }

  // Above average volume with price increase
  if (volumeRatio > 1.5 && priceUp) {
    return {
      signal: 'BUY',
      strength: (volumeRatio - 1) * 50,
      reason: `Above avg volume (${volumeRatio.toFixed(2)}x)`,
      volumeRatio,
    };
  }

  return {
    signal: 'HOLD',
    strength: 0,
    reason: `Normal volume (${volumeRatio.toFixed(2)}x avg)`,
    volumeRatio,
  };
}

/**
 * Calculate Accumulation/Distribution Line
 */
export function calculateADL(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[]
): number[] {
  const adl: number[] = [0];

  for (let i = 0; i < closes.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const close = closes[i];
    const volume = volumes[i];

    // Money Flow Multiplier
    const mfm = high === low ? 0 : ((close - low) - (high - close)) / (high - low);

    // Money Flow Volume
    const mfv = mfm * volume;

    // Accumulation/Distribution Line
    adl.push(adl[i] + mfv);
  }

  return adl.slice(1); // Remove initial 0
}
