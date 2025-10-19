import { calculateRSI } from '../indicators/rsi';
import { calculateMACD, MACDResult } from '../indicators/macd';
import { getVolumeSignal } from '../indicators/volume';
import { calculateRiskScore, RiskScore } from './risk';
import { calculateBollingerBands, BollingerBands } from '../indicators/bollinger';
import { calculateADX, ADXResult, getADXSignal } from '../indicators/adx';
import { calculateATR, ATRResult, calculateATRStopLoss } from '../indicators/atr';
import { calculateStochastic, StochasticResult, getStochasticSignal } from '../indicators/stochastic';
import { 
  calculateVWAP, 
  calculateSuperTrend, 
  calculateIchimoku, 
  calculateParabolicSAR,
  VWAPResult,
  SuperTrendResult,
  IchimokuResult,
  ParabolicSARResult
} from '../indicators/advanced';

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
    adx: ADXResult;
    atr: ATRResult;
    stochastic: StochasticResult;
    vwap: VWAPResult;
    supertrend: SuperTrendResult;
    ichimoku: IchimokuResult;
    parabolicSAR: ParabolicSARResult;
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
 * Generate comprehensive trading signal with ALL indicators
 */
export function generateComprehensiveSignal(
  prices: number[],
  volumes: number[],
  highs: number[],
  lows: number[],
  opens: number[]
): ComprehensiveSignal {
  if (prices.length < 52) {
    throw new Error('Insufficient data for analysis (minimum 52 days required for all indicators)');
  }

  const currentPrice = prices[prices.length - 1];
  const reasons: string[] = [];
  let confidenceScore = 0;

  // 1. Calculate RSI (10% weight)
  const rsi = calculateRSI(prices, 14);
  if (rsi < 30) {
    confidenceScore += 10;
    reasons.push(`RSI oversold at ${rsi.toFixed(2)} - Strong buy signal`);
  } else if (rsi > 70) {
    confidenceScore -= 10;
    reasons.push(`RSI overbought at ${rsi.toFixed(2)} - Caution advised`);
  } else if (rsi >= 50 && rsi <= 60) {
    confidenceScore += 5;
    reasons.push(`RSI healthy at ${rsi.toFixed(2)} - Neutral to bullish`);
  }

  // 2. Calculate MACD (15% weight)
  const macd = calculateMACD(prices);
  if (macd.histogram > 0) {
    confidenceScore += 15;
    reasons.push(`MACD bullish (${macd.histogram.toFixed(2)}) - Upward momentum`);
  } else {
    confidenceScore -= 15;
    reasons.push(`MACD bearish (${macd.histogram.toFixed(2)}) - Downward pressure`);
  }

  // 3. Calculate Bollinger Bands (10% weight)
  const bollinger = calculateBollingerBands(prices, 20, 2);
  let bollingerSignal = 'Neutral';
  
  if (bollinger.percentB < 0.2) {
    confidenceScore += 10;
    bollingerSignal = 'Near Lower Band - Buy Signal';
    reasons.push('Price near lower Bollinger Band - potential bounce');
  } else if (bollinger.percentB > 0.8) {
    confidenceScore -= 10;
    bollingerSignal = 'Near Upper Band - Sell Signal';
    reasons.push('Price near upper Bollinger Band - potential reversal');
  }

  // 4. Calculate ADX - Trend Strength (15% weight)
  const adx = calculateADX(highs, lows, prices, 14);
  const adxSignal = getADXSignal(adx);
  
  if (adx.adx > 25) {
    if (adxSignal.signal === 'BUY') {
      confidenceScore += 15;
      reasons.push(`Strong uptrend confirmed - ADX: ${adx.adx.toFixed(2)}, +DI: ${adx.plusDI.toFixed(2)}`);
    } else if (adxSignal.signal === 'SELL') {
      confidenceScore -= 15;
      reasons.push(`Strong downtrend confirmed - ADX: ${adx.adx.toFixed(2)}, -DI: ${adx.minusDI.toFixed(2)}`);
    }
  } else {
    reasons.push(`Weak trend - ADX: ${adx.adx.toFixed(2)} - Range-bound market`);
  }

  // 5. Calculate ATR for Stop Loss (doesn't affect score, used for risk management)
  const atr = calculateATR(highs, lows, prices, 14);

  // 6. Calculate Stochastic (10% weight)
  const stochastic = calculateStochastic(highs, lows, prices, 14, 3);
  const stochasticSignal = getStochasticSignal(stochastic);
  
  if (stochasticSignal.signal === 'BUY') {
    confidenceScore += 10;
    reasons.push(stochasticSignal.reason);
  } else if (stochasticSignal.signal === 'SELL') {
    confidenceScore -= 10;
    reasons.push(stochasticSignal.reason);
  }

  // 7. Calculate VWAP (5% weight)
  const vwap = calculateVWAP(highs, lows, prices, volumes);
  
  if (vwap.signal === 'above') {
    confidenceScore += 5;
    reasons.push(`Price above VWAP (+${vwap.distance.toFixed(2)}%) - Institutional support`);
  } else if (vwap.signal === 'below') {
    confidenceScore -= 5;
    reasons.push(`Price below VWAP (${vwap.distance.toFixed(2)}%) - Institutional selling`);
  }

  // 8. Calculate SuperTrend (10% weight)
  const supertrend = calculateSuperTrend(highs, lows, prices, 10, 3);
  
  if (supertrend.signal === 'BUY') {
    confidenceScore += 10;
    reasons.push(`SuperTrend bullish - Price above ${supertrend.supertrend.toFixed(2)}`);
  } else if (supertrend.signal === 'SELL') {
    confidenceScore -= 10;
    reasons.push(`SuperTrend bearish - Price below ${supertrend.supertrend.toFixed(2)}`);
  }

  // 9. Calculate Ichimoku Cloud (10% weight)
  const ichimoku = calculateIchimoku(highs, lows, prices);
  
  if (ichimoku.signal === 'bullish') {
    confidenceScore += 10;
    reasons.push('Ichimoku Cloud bullish - Price above cloud with positive momentum');
  } else if (ichimoku.signal === 'bearish') {
    confidenceScore -= 10;
    reasons.push('Ichimoku Cloud bearish - Price below cloud with negative momentum');
  }

  // 10. Calculate Parabolic SAR (5% weight)
  const parabolicSAR = calculateParabolicSAR(highs, lows, prices, 0.02, 0.2);
  
  if (parabolicSAR.signal === 'BUY') {
    confidenceScore += 5;
    reasons.push(`Parabolic SAR buy signal - SAR at ${parabolicSAR.sar.toFixed(2)}`);
  } else if (parabolicSAR.signal === 'SELL') {
    confidenceScore -= 5;
    reasons.push(`Parabolic SAR sell signal - SAR at ${parabolicSAR.sar.toFixed(2)}`);
  }

  // 11. Volume Analysis (5% weight)
  const volumeSignal = getVolumeSignal(volumes, prices);
  if (volumeSignal.signal === 'BUY') {
    confidenceScore += 5;
    reasons.push(volumeSignal.reason);
  } else if (volumeSignal.signal === 'SELL') {
    confidenceScore -= 5;
    reasons.push(volumeSignal.reason);
  }

  // 12. Risk Score (5% weight)
  const riskScore = calculateRiskScore(prices, volumes);
  if (riskScore.level === 'LOW') {
    confidenceScore += 5;
    reasons.push('Low risk profile - suitable for conservative investors');
  } else if (riskScore.level === 'HIGH' || riskScore.level === 'EXTREME') {
    confidenceScore -= 5;
    reasons.push(`${riskScore.level} risk - trade with caution`);
  }

  // Determine final signal type
  let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  const absConfidence = Math.abs(confidenceScore);

  if (confidenceScore > 40) {
    type = 'BUY';
  } else if (confidenceScore < -40) {
    type = 'SELL';
  } else {
    reasons.push('Mixed signals - Wait for clearer trend confirmation');
  }

  // Calculate price targets using ATR for dynamic stop loss
  let targetPrice: number | undefined;
  let stopLoss: number | undefined;
  let riskReward: number | undefined;

  if (type === 'BUY') {
    // Use ATR-based stop loss for better risk management
    stopLoss = calculateATRStopLoss(currentPrice, atr.atr, 2, 'long');
    
    // Target based on risk level and ATR
    const targetMultiplier = riskScore.level === 'LOW' ? 3 : 2.5;
    const targetDistance = atr.atr * targetMultiplier;
    targetPrice = currentPrice + targetDistance;

    // Risk-reward ratio
    const potentialGain = targetPrice - currentPrice;
    const potentialLoss = currentPrice - stopLoss;
    riskReward = potentialGain / potentialLoss;

    reasons.push(`ATR-based Stop Loss: ₹${stopLoss.toFixed(2)} (${((stopLoss - currentPrice) / currentPrice * 100).toFixed(2)}%)`);
    reasons.push(`Target: ₹${targetPrice.toFixed(2)} (${((targetPrice - currentPrice) / currentPrice * 100).toFixed(2)}%)`);
  } else if (type === 'SELL') {
    stopLoss = calculateATRStopLoss(currentPrice, atr.atr, 2, 'short');
    targetPrice = currentPrice - (atr.atr * 2.5);
  }

  // Generate trading recommendation
  const recommendation = generateRecommendation(
    type,
    absConfidence,
    riskScore.level,
    rsi,
    macd.histogram,
    adx.adx
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
      adx,
      atr,
      stochastic,
      vwap,
      supertrend,
      ichimoku,
      parabolicSAR,
    },
    riskScore,
    recommendation,
  };
}

/**
 * Generate trading recommendation based on comprehensive analysis
 */
function generateRecommendation(
  signal: 'BUY' | 'SELL' | 'HOLD',
  confidence: number,
  riskLevel: string,
  rsi: number,
  macdHistogram: number,
  adx: number
): {
  strategy: string;
  description: string;
  positionSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  timeframe: string;
} {
  if (signal === 'BUY') {
    if (confidence > 70 && riskLevel === 'LOW' && adx > 25) {
      return {
        strategy: 'Strong Buy - Swing Trade with Trend Confirmation',
        description: 'Exceptional buy opportunity with strong trend confirmation from ADX. Multiple indicators aligned bullishly with low risk profile. Suitable for swing trading with 3-6 week holding period. All major trend indicators confirm upward momentum.',
        positionSize: 'LARGE',
        timeframe: '3-6 weeks',
      };
    } else if (confidence > 60 && adx > 20) {
      return {
        strategy: 'Moderate Buy - Position Trade',
        description: 'Good buy opportunity with positive trend strength. Multiple technical indicators showing bullish alignment. Consider position trading with 2-4 week holding period. Monitor ADX for trend weakening.',
        positionSize: 'MEDIUM',
        timeframe: '2-4 weeks',
      };
    } else if (confidence > 50) {
      return {
        strategy: 'Cautious Buy - Short-term Trade',
        description: 'Moderate buy signal with mixed trend strength. Suitable for short-term trading with tight stop loss. Use ATR-based stops and book profits on strength. Monitor volume and momentum indicators closely.',
        positionSize: 'SMALL',
        timeframe: '1-2 weeks',
      };
    } else {
      return {
        strategy: 'Weak Buy - Day Trade Only',
        description: 'Weak buy signal with limited conviction. Only for experienced day traders. Use very tight stops and book profits quickly. High chance of reversal, so monitor closely.',
        positionSize: 'SMALL',
        timeframe: '1-3 days',
      };
    }
  } else if (signal === 'SELL') {
    if (confidence > 70) {
      return {
        strategy: 'Strong Sell - Exit All Positions',
        description: 'Clear exit signal with multiple bearish confirmations. If holding, book profits immediately or cut losses. Strong downward momentum detected across multiple timeframes. Consider shorting if experienced.',
        positionSize: 'SMALL',
        timeframe: 'Exit Immediately',
      };
    } else if (confidence > 50) {
      return {
        strategy: 'Moderate Sell - Reduce Exposure',
        description: 'Negative signals building up with trend weakness. Consider reducing position size or tightening stop loss significantly. Watch for potential reversal patterns. Avoid new long positions.',
        positionSize: 'SMALL',
        timeframe: 'Reduce within 2-3 days',
      };
    } else {
      return {
        strategy: 'Weak Sell - Caution Advised',
        description: 'Some negative indicators present but not confirmed. Tighten stops and avoid adding to positions. Wait for clearer confirmation before taking action.',
        positionSize: 'SMALL',
        timeframe: 'Monitor closely',
      };
    }
  } else {
    return {
      strategy: 'Hold - Wait for Clarity',
      description: 'Mixed signals across indicators with no clear trend direction. Wait for stronger confirmation from multiple indicators. Focus on capital preservation. Look for better risk-reward opportunities elsewhere.',
      positionSize: 'SMALL',
      timeframe: 'Wait & Watch',
    };
  }
}