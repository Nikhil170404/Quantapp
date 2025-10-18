import { calculateRSI } from '../indicators/rsi';
import { calculateMACD, MACDResult } from '../indicators/macd';
import { getVolumeSignal } from '../indicators/volume';
import { calculateRiskScore, RiskScore } from './risk';
import { calculateBollingerBands, BollingerBands } from '../indicators/bollinger';

export interface ComprehensiveSignal {
  signal: {
    type: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasons: string[];
    entryPrice: number;
    targetPrice?: number;
    stopLoss?: number;
    riskReward?: number;
  };
  indicators: {
    rsi: number;
    macd: MACDResult;
    volumeRatio: number;
    bollingerBand: BollingerBands & { signal: string };
  };
  riskScore: RiskScore;
  recommendation: {
    strategy: string;
    description: string;
    positionSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    timeframe: string;
  };
}

/**
 * Generate comprehensive trading signal with all indicators
 */
export function generateComprehensiveSignal(
  prices: number[],
  volumes: number[],
  highs: number[],
  lows: number[],
  opens: number[]
): ComprehensiveSignal {
  if (prices.length < 30) {
    throw new Error('Insufficient data for analysis (minimum 30 days required)');
  }

  const currentPrice = prices[prices.length - 1];
  const reasons: string[] = [];
  let confidenceScore = 0;

  // 1. Calculate RSI
  const rsi = calculateRSI(prices, 14);
  if (rsi < 30) {
    confidenceScore += 25;
    reasons.push(`RSI oversold at ${rsi.toFixed(2)} - Strong buy signal`);
  } else if (rsi > 70) {
    confidenceScore -= 25;
    reasons.push(`RSI overbought at ${rsi.toFixed(2)} - Caution advised`);
  } else if (rsi >= 50 && rsi <= 60) {
    confidenceScore += 10;
    reasons.push(`RSI healthy at ${rsi.toFixed(2)} - Neutral to bullish`);
  }

  // 2. Calculate MACD
  const macd = calculateMACD(prices);
  if (macd.histogram > 0) {
    confidenceScore += 20;
    reasons.push(`MACD bullish (${macd.histogram.toFixed(2)}) - Upward momentum`);
  } else {
    confidenceScore -= 20;
    reasons.push(`MACD bearish (${macd.histogram.toFixed(2)}) - Downward pressure`);
  }

  // 3. Calculate Bollinger Bands
  const bollinger = calculateBollingerBands(prices, 20, 2);
  let bollingerSignal = 'Neutral';
  
  if (bollinger.percentB < 0.2) {
    confidenceScore += 20;
    bollingerSignal = 'Near Lower Band - Buy Signal';
    reasons.push('Price near lower Bollinger Band - potential bounce');
  } else if (bollinger.percentB > 0.8) {
    confidenceScore -= 20;
    bollingerSignal = 'Near Upper Band - Sell Signal';
    reasons.push('Price near upper Bollinger Band - potential reversal');
  } else if (bollinger.percentB >= 0.4 && bollinger.percentB <= 0.6) {
    bollingerSignal = 'Middle Band - Neutral';
    reasons.push('Price in middle Bollinger Band - wait for better entry');
  }

  // 4. Volume Analysis
  const volumeSignal = getVolumeSignal(volumes, prices);
  if (volumeSignal.signal === 'BUY') {
    confidenceScore += 15;
    reasons.push(volumeSignal.reason);
  } else if (volumeSignal.signal === 'SELL') {
    confidenceScore -= 15;
    reasons.push(volumeSignal.reason);
  }

  // 5. Risk Score
  const riskScore = calculateRiskScore(prices, volumes);
  if (riskScore.level === 'LOW') {
    confidenceScore += 10;
    reasons.push('Low risk profile - good for conservative investors');
  } else if (riskScore.level === 'HIGH' || riskScore.level === 'EXTREME') {
    confidenceScore -= 10;
    reasons.push(`${riskScore.level} risk - trade with caution`);
  }

  // 6. Moving Average Crossover (50-day vs 200-day)
  if (prices.length >= 200) {
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
    const sma200 = prices.slice(-200).reduce((a, b) => a + b, 0) / 200;
    
    if (sma50 > sma200) {
      confidenceScore += 15;
      reasons.push('Golden Cross detected - Long-term bullish trend');
    } else if (sma50 < sma200) {
      confidenceScore -= 15;
      reasons.push('Death Cross detected - Long-term bearish trend');
    }
  }

  // Determine final signal type
  let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  const absConfidence = Math.abs(confidenceScore);

  if (confidenceScore > 50) {
    type = 'BUY';
  } else if (confidenceScore < -50) {
    type = 'SELL';
  } else {
    reasons.push('Mixed signals - Wait for clearer trend');
  }

  // Calculate price targets based on risk and type
  let targetPrice: number | undefined;
  let stopLoss: number | undefined;
  let riskReward: number | undefined;

  if (type === 'BUY') {
    // Target based on risk level and Bollinger width
    const targetPercent = riskScore.level === 'LOW' ? 0.08 : 0.06;
    targetPrice = currentPrice * (1 + targetPercent);

    // Stop loss based on risk level
    const stopPercent = riskScore.level === 'LOW' ? 0.03 : 
                       riskScore.level === 'MEDIUM' ? 0.05 : 0.07;
    stopLoss = currentPrice * (1 - stopPercent);

    // Risk-reward ratio
    const potentialGain = targetPrice - currentPrice;
    const potentialLoss = currentPrice - stopLoss;
    riskReward = potentialGain / potentialLoss;

    reasons.push(`Target: ₹${targetPrice.toFixed(2)} | Stop Loss: ₹${stopLoss.toFixed(2)}`);
  } else if (type === 'SELL') {
    targetPrice = currentPrice * 0.94;
    stopLoss = currentPrice * 1.04;
  }

  // Generate trading recommendation
  const recommendation = generateRecommendation(
    type,
    absConfidence,
    riskScore.level,
    rsi,
    macd.histogram
  );

  return {
    signal: {
      type,
      confidence: Number(absConfidence.toFixed(2)),
      reasons,
      entryPrice: currentPrice,
      targetPrice,
      stopLoss,
      riskReward: riskReward ? Number(riskReward.toFixed(2)) : undefined,
    },
    indicators: {
      rsi,
      macd,
      volumeRatio: volumeSignal.volumeRatio,
      bollingerBand: {
        ...bollinger,
        signal: bollingerSignal,
      },
    },
    riskScore,
    recommendation,
  };
}

/**
 * Generate trading recommendation based on analysis
 */
function generateRecommendation(
  signal: 'BUY' | 'SELL' | 'HOLD',
  confidence: number,
  riskLevel: string,
  rsi: number,
  macdHistogram: number
): {
  strategy: string;
  description: string;
  positionSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  timeframe: string;
} {
  if (signal === 'BUY') {
    if (confidence > 75 && riskLevel === 'LOW') {
      return {
        strategy: 'Strong Buy - Swing Trade',
        description: 'High confidence buy signal with low risk. Suitable for swing trading with 2-4 week holding period. Strong technical momentum and favorable risk profile.',
        positionSize: 'LARGE',
        timeframe: '2-4 weeks',
      };
    } else if (confidence > 60 && (riskLevel === 'LOW' || riskLevel === 'MEDIUM')) {
      return {
        strategy: 'Moderate Buy - Short-term Trade',
        description: 'Good buy opportunity with moderate confidence. Consider short-term position with tight stop loss. Monitor daily for exit signals.',
        positionSize: 'MEDIUM',
        timeframe: '1-2 weeks',
      };
    } else {
      return {
        strategy: 'Cautious Buy - Day Trade',
        description: 'Weak buy signal. Only for experienced traders with intraday focus. Use very tight stop loss and book profits quickly.',
        positionSize: 'SMALL',
        timeframe: '1-3 days',
      };
    }
  } else if (signal === 'SELL') {
    if (confidence > 75) {
      return {
        strategy: 'Strong Sell - Exit Position',
        description: 'Clear exit signal. If holding, consider booking profits or cutting losses. Strong bearish momentum detected.',
        positionSize: 'SMALL',
        timeframe: 'Exit Immediately',
      };
    } else {
      return {
        strategy: 'Moderate Sell - Reduce Exposure',
        description: 'Negative signals building up. Consider reducing position size or tightening stop loss. Watch for reversal patterns.',
        positionSize: 'SMALL',
        timeframe: 'Monitor closely',
      };
    }
  } else {
    return {
      strategy: 'Hold - Wait for Clarity',
      description: 'Mixed signals present. Wait for clearer trend formation. Focus on capital preservation and look for better opportunities.',
      positionSize: 'SMALL',
      timeframe: 'Wait & Watch',
    };
  }
}