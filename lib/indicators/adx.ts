/**
 * ADX (Average Directional Index)
 * 
 * Measures trend strength (NOT direction)
 * - ADX > 25: Strong trend
 * - ADX < 20: Weak trend/ranging market
 * 
 * Also provides +DI and -DI for direction
 */

export interface ADXResult {
  adx: number;
  plusDI: number;
  minusDI: number;
  trendStrength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  signal: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Calculate directional movement
 */
function calculateDirectionalMovement(
  highs: number[],
  lows: number[]
): { plusDM: number[]; minusDM: number[] } {
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
      minusDM.push(0);
    } else if (downMove > upMove && downMove > 0) {
      plusDM.push(0);
      minusDM.push(downMove);
    } else {
      plusDM.push(0);
      minusDM.push(0);
    }
  }

  return { plusDM, minusDM };
}

/**
 * Calculate True Range
 */
function calculateTrueRange(
  highs: number[],
  lows: number[],
  closes: number[]
): number[] {
  const tr: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const method1 = highs[i] - lows[i];
    const method2 = Math.abs(highs[i] - closes[i - 1]);
    const method3 = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(method1, method2, method3));
  }

  return tr;
}

/**
 * Wilder's smoothing
 */
function wildersSmoothing(values: number[], period: number): number[] {
  if (values.length < period) return [];

  const smoothed: number[] = [];
  
  // First value is simple average
  let sum = values.slice(0, period).reduce((a, b) => a + b, 0);
  smoothed.push(sum);

  // Subsequent values use Wilder's smoothing
  for (let i = period; i < values.length; i++) {
    sum = sum - (sum / period) + values[i];
    smoothed.push(sum);
  }

  return smoothed;
}

/**
 * Calculate ADX
 * 
 * @param highs Array of high prices
 * @param lows Array of low prices
 * @param closes Array of closing prices
 * @param period ADX period (default: 14)
 * @returns ADX result
 */
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): ADXResult {
  if (highs.length < period * 2) {
    return {
      adx: 0,
      plusDI: 0,
      minusDI: 0,
      trendStrength: 'weak',
      signal: 'neutral',
    };
  }

  // Calculate directional movement
  const { plusDM, minusDM } = calculateDirectionalMovement(highs, lows);
  
  // Calculate True Range
  const tr = calculateTrueRange(highs, lows, closes);

  // Smooth DM and TR
  const smoothedPlusDM = wildersSmoothing(plusDM, period);
  const smoothedMinusDM = wildersSmoothing(minusDM, period);
  const smoothedTR = wildersSmoothing(tr, period);

  // Calculate DI
  const plusDI: number[] = [];
  const minusDI: number[] = [];

  for (let i = 0; i < smoothedTR.length; i++) {
    plusDI.push((smoothedPlusDM[i] / smoothedTR[i]) * 100);
    minusDI.push((smoothedMinusDM[i] / smoothedTR[i]) * 100);
  }

  // Calculate DX (Directional Index)
  const dx: number[] = [];
  for (let i = 0; i < plusDI.length; i++) {
    const sum = plusDI[i] + minusDI[i];
    if (sum === 0) {
      dx.push(0);
    } else {
      dx.push((Math.abs(plusDI[i] - minusDI[i]) / sum) * 100);
    }
  }

  // Calculate ADX (smoothed DX)
  const adxValues = wildersSmoothing(dx, period);
  const adx = adxValues[adxValues.length - 1] || 0;
  const currentPlusDI = plusDI[plusDI.length - 1] || 0;
  const currentMinusDI = minusDI[minusDI.length - 1] || 0;

  // Determine trend strength
  let trendStrength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  if (adx < 20) trendStrength = 'weak';
  else if (adx < 30) trendStrength = 'moderate';
  else if (adx < 50) trendStrength = 'strong';
  else trendStrength = 'very_strong';

  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral';
  if (currentPlusDI > currentMinusDI) {
    signal = 'bullish';
  } else if (currentMinusDI > currentPlusDI) {
    signal = 'bearish';
  } else {
    signal = 'neutral';
  }

  return {
    adx: Number(adx.toFixed(2)),
    plusDI: Number(currentPlusDI.toFixed(2)),
    minusDI: Number(currentMinusDI.toFixed(2)),
    trendStrength,
    signal,
  };
}

/**
 * Get ADX trading signal
 */
export function getADXSignal(adx: ADXResult): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  reason: string;
} {
  const { adx: adxValue, plusDI, minusDI, trendStrength } = adx;

  // Strong trend + bullish direction
  if (adxValue > 25 && plusDI > minusDI && plusDI > 25) {
    return {
      signal: 'BUY',
      strength: Math.min(adxValue, 100),
      reason: `Strong ${trendStrength} uptrend (ADX: ${adxValue}, +DI: ${plusDI})`,
    };
  }

  // Strong trend + bearish direction
  if (adxValue > 25 && minusDI > plusDI && minusDI > 25) {
    return {
      signal: 'SELL',
      strength: Math.min(adxValue, 100),
      reason: `Strong ${trendStrength} downtrend (ADX: ${adxValue}, -DI: ${minusDI})`,
    };
  }

  // Weak trend - range bound
  if (adxValue < 20) {
    return {
      signal: 'HOLD',
      strength: 0,
      reason: `Weak trend/ranging market (ADX: ${adxValue}) - wait for breakout`,
    };
  }

  return {
    signal: 'HOLD',
    strength: 0,
    reason: `Trend present but no clear direction (ADX: ${adxValue})`,
  };
}

/**
 * Detect ADX crossover (DI crossover)
 */
export function detectADXCrossover(
  current: ADXResult,
  previous: ADXResult
): 'bullish' | 'bearish' | null {
  // Bullish crossover: +DI crosses above -DI
  if (
    current.plusDI > current.minusDI &&
    previous.plusDI <= previous.minusDI
  ) {
    return 'bullish';
  }

  // Bearish crossover: -DI crosses above +DI
  if (
    current.minusDI > current.plusDI &&
    previous.minusDI <= previous.plusDI
  ) {
    return 'bearish';
  }

  return null;
}