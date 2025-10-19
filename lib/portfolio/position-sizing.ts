/**
 * Professional Position Sizing Algorithms
 * 
 * Methods:
 * - Fixed Dollar
 * - Fixed Percent
 * - Kelly Criterion
 * - ATR-based
 * - Volatility-adjusted
 * - Risk Parity
 */

export interface PositionSizeResult {
  shares: number;
  dollarAmount: number;
  riskAmount: number;
  method: string;
  confidence: number;
}

/**
 * Fixed dollar position sizing
 */
export function fixedDollarSize(
  accountSize: number,
  fixedAmount: number,
  price: number
): PositionSizeResult {
  const shares = Math.floor(fixedAmount / price);
  const dollarAmount = shares * price;

  return {
    shares,
    dollarAmount,
    riskAmount: 0,
    method: 'fixed_dollar',
    confidence: 100,
  };
}

/**
 * Fixed percent position sizing
 */
export function fixedPercentSize(
  accountSize: number,
  percent: number,
  price: number
): PositionSizeResult {
  const dollarAmount = accountSize * (percent / 100);
  const shares = Math.floor(dollarAmount / price);
  const actualDollarAmount = shares * price;

  return {
    shares,
    dollarAmount: actualDollarAmount,
    riskAmount: 0,
    method: 'fixed_percent',
    confidence: 100,
  };
}

/**
 * Kelly Criterion position sizing
 * 
 * Optimal position size for maximizing long-term growth
 * Formula: f* = (bp - q) / b
 * where:
 *   f* = fraction of capital to wager
 *   b = odds (avg_win / avg_loss)
 *   p = win probability
 *   q = loss probability (1 - p)
 */
export function kellySize(
  accountSize: number,
  price: number,
  winRate: number,
  avgWinLossRatio: number,
  fractionalKelly: number = 0.25 // Use 25% Kelly for safety
): PositionSizeResult {
  // Kelly formula
  const p = winRate;
  const q = 1 - p;
  const b = avgWinLossRatio;

  let kelly = (b * p - q) / b;

  // Cap Kelly at reasonable levels
  kelly = Math.max(0, Math.min(kelly, 0.5));

  // Apply fractional Kelly
  const finalKelly = kelly * fractionalKelly;

  const dollarAmount = accountSize * finalKelly;
  const shares = Math.floor(dollarAmount / price);
  const actualDollarAmount = shares * price;

  return {
    shares,
    dollarAmount: actualDollarAmount,
    riskAmount: 0,
    method: 'kelly_criterion',
    confidence: Math.round(finalKelly * 100),
  };
}

/**
 * ATR-based position sizing
 * Size based on volatility - fixed risk per trade
 * 
 * @param accountSize Total account value
 * @param riskPercent Percent of account to risk (e.g., 1 = 1%)
 * @param entryPrice Entry price
 * @param atr Current ATR value
 * @param atrMultiplier Stop loss distance in ATRs (e.g., 2)
 */
export function atrBasedSize(
  accountSize: number,
  riskPercent: number,
  entryPrice: number,
  atr: number,
  atrMultiplier: number = 2
): PositionSizeResult {
  const riskAmount = accountSize * (riskPercent / 100);
  const stopDistance = atr * atrMultiplier;
  const shares = Math.floor(riskAmount / stopDistance);
  const dollarAmount = shares * entryPrice;

  return {
    shares,
    dollarAmount,
    riskAmount,
    method: 'atr_based',
    confidence: 100,
  };
}

/**
 * Volatility-adjusted position sizing
 * Inverse volatility - higher volatility = smaller position
 */
export function volatilityAdjustedSize(
  accountSize: number,
  basePercent: number,
  price: number,
  currentVolatility: number,
  targetVolatility: number = 15 // Target annual volatility %
): PositionSizeResult {
  // Adjust position size inversely to volatility
  const volRatio = targetVolatility / currentVolatility;
  const adjustedPercent = basePercent * volRatio;

  // Cap at reasonable levels
  const finalPercent = Math.max(0.5, Math.min(adjustedPercent, 50));

  const dollarAmount = accountSize * (finalPercent / 100);
  const shares = Math.floor(dollarAmount / price);
  const actualDollarAmount = shares * price;

  return {
    shares,
    dollarAmount: actualDollarAmount,
    riskAmount: 0,
    method: 'volatility_adjusted',
    confidence: Math.round((targetVolatility / currentVolatility) * 100),
  };
}

/**
 * Risk parity position sizing
 * Equal risk contribution from each position
 */
export function riskParitySize(
  accountSize: number,
  price: number,
  stockVolatility: number,
  portfolioVolatility: number,
  numPositions: number
): PositionSizeResult {
  // Target: Equal risk contribution
  const targetRiskContribution = 1 / numPositions;
  
  // Position size inverse to volatility
  const weight = targetRiskContribution * (portfolioVolatility / stockVolatility);
  
  const dollarAmount = accountSize * weight;
  const shares = Math.floor(dollarAmount / price);
  const actualDollarAmount = shares * price;

  return {
    shares,
    dollarAmount: actualDollarAmount,
    riskAmount: 0,
    method: 'risk_parity',
    confidence: Math.round(weight * 100),
  };
}

/**
 * Dynamic position sizing based on confidence
 * Higher confidence = larger position
 */
export function confidenceBasedSize(
  accountSize: number,
  price: number,
  confidence: number, // 0-100
  basePercent: number = 5,
  maxPercent: number = 20
): PositionSizeResult {
  // Scale position size with confidence
  const scaledPercent = basePercent + (confidence / 100) * (maxPercent - basePercent);
  
  const dollarAmount = accountSize * (scaledPercent / 100);
  const shares = Math.floor(dollarAmount / price);
  const actualDollarAmount = shares * price;

  return {
    shares,
    dollarAmount: actualDollarAmount,
    riskAmount: 0,
    method: 'confidence_based',
    confidence: Math.round(scaledPercent),
  };
}

/**
 * Calculate optimal position size using multiple methods
 * Returns the most conservative estimate
 */
export function calculateOptimalSize(
  accountSize: number,
  price: number,
  params: {
    riskPercent?: number;
    atr?: number;
    atrMultiplier?: number;
    winRate?: number;
    avgWinLossRatio?: number;
    volatility?: number;
    confidence?: number;
  }
): PositionSizeResult {
  const results: PositionSizeResult[] = [];

  // ATR-based (if available)
  if (params.atr && params.riskPercent) {
    results.push(
      atrBasedSize(
        accountSize,
        params.riskPercent,
        price,
        params.atr,
        params.atrMultiplier
      )
    );
  }

  // Kelly (if available)
  if (params.winRate && params.avgWinLossRatio) {
    results.push(
      kellySize(
        accountSize,
        price,
        params.winRate,
        params.avgWinLossRatio
      )
    );
  }

  // Volatility-adjusted (if available)
  if (params.volatility) {
    results.push(
      volatilityAdjustedSize(
        accountSize,
        10, // base 10%
        price,
        params.volatility
      )
    );
  }

  // Confidence-based (if available)
  if (params.confidence) {
    results.push(
      confidenceBasedSize(
        accountSize,
        price,
        params.confidence
      )
    );
  }

  // If no specialized methods available, use fixed 5%
  if (results.length === 0) {
    results.push(fixedPercentSize(accountSize, 5, price));
  }

  // Return most conservative (smallest position)
  return results.reduce((min, current) => 
    current.shares < min.shares ? current : min
  );
}

/**
 * Portfolio heat check
 * Ensures total portfolio risk doesn't exceed limit
 */
export function checkPortfolioHeat(
  existingPositions: Array<{
    symbol: string;
    dollarAmount: number;
    riskPercent: number;
  }>,
  newPositionRisk: number,
  maxPortfolioRisk: number = 10 // Max 10% portfolio risk
): {
  allowed: boolean;
  currentRisk: number;
  newRisk: number;
  message: string;
} {
  const currentRisk = existingPositions.reduce(
    (sum, pos) => sum + pos.riskPercent,
    0
  );
  const newRisk = currentRisk + newPositionRisk;

  return {
    allowed: newRisk <= maxPortfolioRisk,
    currentRisk,
    newRisk,
    message: newRisk > maxPortfolioRisk
      ? `Portfolio heat too high: ${newRisk.toFixed(2)}% > ${maxPortfolioRisk}%`
      : `Portfolio heat OK: ${newRisk.toFixed(2)}% <= ${maxPortfolioRisk}%`,
  };
}