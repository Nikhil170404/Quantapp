import { calculateRSI, getRSISignal } from '../indicators/rsi';
import { calculateMACD, getMACDSignal, MACDResult } from '../indicators/macd';
import { getVolumeSignal } from '../indicators/volume';
import { calculateRiskScore, getRiskRecommendation, RiskScore } from './risk';

/**
 * Trading Signal Types
 */
export interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reasons: string[];
  entryPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  riskReward?: number;
  riskScore: RiskScore;
  indicators: {
    rsi: number;
    macd: MACDResult;
    volumeRatio: number;
  };
}

/**
 * Generate comprehensive trading signal
 *
 * This combines multiple technical indicators:
 * - RSI (30% weight)
 * - MACD (35% weight)
 * - Volume (25% weight)
 * - Risk Score (10% weight)
 *
 * @param prices Array of closing prices
 * @param volumes Array of volumes
 * @param highs Optional array of high prices
 * @param lows Optional array of low prices
 * @returns Trading signal with recommendations
 */
export function generateSignal(
  prices: number[],
  volumes: number[],
  highs?: number[],
  lows?: number[]
): TradingSignal {
  if (prices.length < 30 || volumes.length < 30) {
    return {
      type: 'HOLD',
      confidence: 0,
      reasons: ['Insufficient data for analysis'],
      entryPrice: prices[prices.length - 1] || 0,
      riskScore: {
        score: 50,
        level: 'MEDIUM',
        volatility: 0,
        volumeRatio: 1,
        priceDeviation: 0,
        breakdown: { volatilityRisk: 0, volumeRisk: 0, priceRisk: 0 },
      },
      indicators: {
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        volumeRatio: 1,
      },
    };
  }

  const currentPrice = prices[prices.length - 1];
  const reasons: string[] = [];
  let confidenceScore = 0;

  // 1. Calculate RSI
  const rsi = calculateRSI(prices, 14);
  const rsiSignal = getRSISignal(rsi);

  // 2. Calculate MACD
  const macd = calculateMACD(prices);
  const macdSignal = getMACDSignal(macd);

  // 3. Calculate Volume Signal
  const volumeSignal = getVolumeSignal(volumes, prices);

  // 4. Calculate Risk Score
  const riskScore = calculateRiskScore(prices, volumes);

  // --- Signal Calculation ---

  // RSI contribution (30% weight)
  if (rsiSignal.signal === 'BUY') {
    confidenceScore += rsiSignal.strength * 0.3;
    reasons.push(rsiSignal.reason);
  } else if (rsiSignal.signal === 'SELL') {
    confidenceScore -= rsiSignal.strength * 0.3;
    reasons.push(rsiSignal.reason);
  }

  // MACD contribution (35% weight)
  if (macdSignal.signal === 'BUY') {
    confidenceScore += macdSignal.strength * 0.35;
    reasons.push(macdSignal.reason);
  } else if (macdSignal.signal === 'SELL') {
    confidenceScore -= macdSignal.strength * 0.35;
    reasons.push(macdSignal.reason);
  }

  // Volume contribution (25% weight)
  if (volumeSignal.signal === 'BUY') {
    confidenceScore += volumeSignal.strength * 0.25;
    reasons.push(volumeSignal.reason);
  } else if (volumeSignal.signal === 'SELL') {
    confidenceScore -= volumeSignal.strength * 0.25;
    reasons.push(volumeSignal.reason);
  }

  // Risk adjustment (-10% for high risk, +10% for low risk)
  if (riskScore.level === 'LOW') {
    confidenceScore += 10;
    reasons.push('Low risk stock');
  } else if (riskScore.level === 'HIGH' || riskScore.level === 'EXTREME') {
    confidenceScore -= 10;
    reasons.push(`${riskScore.level.toLowerCase()} risk detected`);
  }

  // Determine final signal type
  let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  const absConfidence = Math.abs(confidenceScore);

  if (confidenceScore > 50) {
    type = 'BUY';
  } else if (confidenceScore < -50) {
    type = 'SELL';
  }

  // Calculate price targets
  const riskRecommendation = getRiskRecommendation(riskScore);
  let targetPrice: number | undefined;
  let stopLoss: number | undefined;
  let riskReward: number | undefined;

  if (type === 'BUY') {
    // Target: 6-10% based on risk
    const targetPercent = riskScore.level === 'LOW' ? 0.08 : 0.06;
    targetPrice = currentPrice * (1 + targetPercent);

    // Stop loss: based on risk level
    stopLoss = currentPrice * (1 - riskRecommendation.stopLossPercent / 100);

    // Risk-reward ratio
    const potentialGain = targetPrice - currentPrice;
    const potentialLoss = currentPrice - stopLoss;
    riskReward = potentialGain / potentialLoss;

    reasons.push(`Target: ₹${targetPrice.toFixed(2)} (${(targetPercent * 100).toFixed(1)}%)`);
    reasons.push(`Stop Loss: ₹${stopLoss.toFixed(2)} (${riskRecommendation.stopLossPercent}%)`);
  } else if (type === 'SELL') {
    // For sell signals, reverse the logic
    targetPrice = currentPrice * 0.94; // 6% down target
    stopLoss = currentPrice * 1.04; // 4% up stop loss
  }

  return {
    type,
    confidence: Number(absConfidence.toFixed(2)),
    reasons,
    entryPrice: currentPrice,
    targetPrice,
    stopLoss,
    riskReward,
    riskScore,
    indicators: {
      rsi,
      macd,
      volumeRatio: volumeSignal.volumeRatio,
    },
  };
}

/**
 * Generate signals for multiple stocks
 */
export async function generateMultipleSignals(
  stocksData: Array<{
    symbol: string;
    prices: number[];
    volumes: number[];
    highs?: number[];
    lows?: number[];
  }>
): Promise<Array<{ symbol: string; signal: TradingSignal }>> {
  return stocksData.map((stock) => ({
    symbol: stock.symbol,
    signal: generateSignal(stock.prices, stock.volumes, stock.highs, stock.lows),
  }));
}

/**
 * Filter signals by criteria
 */
export function filterSignals(
  signals: Array<{ symbol: string; signal: TradingSignal }>,
  criteria: {
    minConfidence?: number;
    signalType?: 'BUY' | 'SELL' | 'HOLD';
    maxRisk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    minRiskReward?: number;
  }
): Array<{ symbol: string; signal: TradingSignal }> {
  return signals.filter((item) => {
    const { signal } = item;

    // Filter by confidence
    if (criteria.minConfidence && signal.confidence < criteria.minConfidence) {
      return false;
    }

    // Filter by signal type
    if (criteria.signalType && signal.type !== criteria.signalType) {
      return false;
    }

    // Filter by risk level
    if (criteria.maxRisk) {
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'];
      const maxRiskIndex = riskLevels.indexOf(criteria.maxRisk);
      const currentRiskIndex = riskLevels.indexOf(signal.riskScore.level);
      if (currentRiskIndex > maxRiskIndex) {
        return false;
      }
    }

    // Filter by risk-reward ratio
    if (criteria.minRiskReward && signal.riskReward) {
      if (signal.riskReward < criteria.minRiskReward) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort signals by various criteria
 */
export function sortSignals(
  signals: Array<{ symbol: string; signal: TradingSignal }>,
  sortBy: 'confidence' | 'risk' | 'riskReward' = 'confidence',
  order: 'asc' | 'desc' = 'desc'
): Array<{ symbol: string; signal: TradingSignal }> {
  return [...signals].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'confidence':
        compareValue = a.signal.confidence - b.signal.confidence;
        break;
      case 'risk':
        compareValue = a.signal.riskScore.score - b.signal.riskScore.score;
        break;
      case 'riskReward':
        const aRR = a.signal.riskReward || 0;
        const bRR = b.signal.riskReward || 0;
        compareValue = aRR - bRR;
        break;
    }

    return order === 'desc' ? -compareValue : compareValue;
  });
}
