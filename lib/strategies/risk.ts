/**
 * Risk Scoring and Analysis
 */

export interface RiskScore {
  score: number; // 0-100 (0=low risk, 100=high risk)
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  volatility: number;
  volumeRatio: number;
  priceDeviation: number;
  breakdown: {
    volatilityRisk: number;
    volumeRisk: number;
    priceRisk: number;
  };
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate risk score for a stock
 *
 * Factors considered:
 * 1. Price volatility (40% weight)
 * 2. Volume abnormality (30% weight)
 * 3. Price deviation from MA (30% weight)
 *
 * @param prices Array of closing prices
 * @param volumes Array of volumes
 * @param period Lookback period (default: 20)
 * @returns Risk score object
 */
export function calculateRiskScore(
  prices: number[],
  volumes: number[],
  period: number = 20
): RiskScore {
  if (prices.length < period || volumes.length < period) {
    return {
      score: 50,
      level: 'MEDIUM',
      volatility: 0,
      volumeRatio: 1,
      priceDeviation: 0,
      breakdown: { volatilityRisk: 0, volumeRisk: 0, priceRisk: 0 },
    };
  }

  // 1. Calculate volatility (standard deviation / mean)
  const recentPrices = prices.slice(-period);
  const mean = recentPrices.reduce((a, b) => a + b, 0) / period;
  const stdDev = calculateStdDev(recentPrices);
  const volatility = (stdDev / mean) * 100;

  // Volatility risk (0-40 points)
  const volatilityRisk = Math.min(volatility * 4, 40);

  // 2. Volume analysis
  const recentVolumes = volumes.slice(-period);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / period;
  const currentVolume = volumes[volumes.length - 1];
  const volumeRatio = currentVolume / avgVolume;

  // Volume risk (0-30 points) - high deviation is risky
  const volumeDeviation = Math.abs(volumeRatio - 1);
  const volumeRisk = Math.min(volumeDeviation * 30, 30);

  // 3. Price deviation from moving average
  const ma20 = mean;
  const currentPrice = prices[prices.length - 1];
  const priceDeviation = Math.abs((currentPrice - ma20) / ma20) * 100;

  // Price risk (0-30 points)
  const priceRisk = Math.min(priceDeviation * 3, 30);

  // Composite risk score (0-100)
  const score = Math.min(100, volatilityRisk + volumeRisk + priceRisk);

  // Determine risk level
  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  if (score < 30) level = 'LOW';
  else if (score < 60) level = 'MEDIUM';
  else if (score < 80) level = 'HIGH';
  else level = 'EXTREME';

  return {
    score: Number(score.toFixed(2)),
    level,
    volatility: Number(volatility.toFixed(2)),
    volumeRatio: Number(volumeRatio.toFixed(2)),
    priceDeviation: Number(priceDeviation.toFixed(2)),
    breakdown: {
      volatilityRisk: Number(volatilityRisk.toFixed(2)),
      volumeRisk: Number(volumeRisk.toFixed(2)),
      priceRisk: Number(priceRisk.toFixed(2)),
    },
  };
}

/**
 * Calculate Beta (correlation with market)
 */
export function calculateBeta(
  stockReturns: number[],
  marketReturns: number[]
): number {
  if (stockReturns.length !== marketReturns.length || stockReturns.length === 0) {
    return 1;
  }

  const n = stockReturns.length;

  // Calculate means
  const stockMean = stockReturns.reduce((a, b) => a + b, 0) / n;
  const marketMean = marketReturns.reduce((a, b) => a + b, 0) / n;

  // Calculate covariance and variance
  let covariance = 0;
  let marketVariance = 0;

  for (let i = 0; i < n; i++) {
    covariance += (stockReturns[i] - stockMean) * (marketReturns[i] - marketMean);
    marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
  }

  covariance /= n;
  marketVariance /= n;

  if (marketVariance === 0) return 1;

  return Number((covariance / marketVariance).toFixed(2));
}

/**
 * Calculate Sharpe Ratio
 * Measures risk-adjusted return
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.05
): number {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = calculateStdDev(returns);

  if (stdDev === 0) return 0;

  const sharpeRatio = (avgReturn - riskFreeRate) / stdDev;
  return Number(sharpeRatio.toFixed(2));
}

/**
 * Calculate Maximum Drawdown
 */
export function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;

  let maxPrice = prices[0];
  let maxDrawdown = 0;

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > maxPrice) {
      maxPrice = prices[i];
    }

    const drawdown = ((maxPrice - prices[i]) / maxPrice) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return Number(maxDrawdown.toFixed(2));
}

/**
 * Calculate Value at Risk (VaR) - 95% confidence
 */
export function calculateVaR(returns: number[], confidenceLevel: number = 0.95): number {
  if (returns.length === 0) return 0;

  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sorted.length);

  return Number(Math.abs(sorted[index] || 0).toFixed(2));
}

/**
 * Get risk recommendation
 */
export function getRiskRecommendation(riskScore: RiskScore): {
  recommendation: string;
  positionSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  stopLossPercent: number;
} {
  const { level, score } = riskScore;

  if (level === 'LOW') {
    return {
      recommendation: 'Low risk stock suitable for conservative investors',
      positionSize: 'LARGE',
      stopLossPercent: 3,
    };
  } else if (level === 'MEDIUM') {
    return {
      recommendation: 'Moderate risk - suitable for balanced portfolios',
      positionSize: 'MEDIUM',
      stopLossPercent: 5,
    };
  } else if (level === 'HIGH') {
    return {
      recommendation: 'High risk - only for aggressive traders',
      positionSize: 'SMALL',
      stopLossPercent: 7,
    };
  } else {
    return {
      recommendation: 'Extreme risk - avoid or trade with caution',
      positionSize: 'SMALL',
      stopLossPercent: 10,
    };
  }
}
