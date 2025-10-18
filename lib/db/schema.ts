// MongoDB Schema Definitions

export interface StockTick {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Technical indicators
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  // Risk metrics
  riskScore?: number;
  volatility?: number;
  volumeRatio?: number;
  priceDeviation?: number;
  // Trading signals
  buySignal?: boolean;
  sellSignal?: boolean;
  signalConfidence?: number;
  targetPrice?: number;
  stopLoss?: number;
  riskReward?: number;
  signalReasons?: string[];
}

export interface StockNews {
  symbol: string;
  title: string;
  snippet: string;
  url?: string;
  timestamp: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}

export interface WatchlistItem {
  userId: string;
  symbol: string;
  addedAt: Date;
  targetPrice?: number;
  alertOnTarget?: boolean;
}

// Time-series collection configuration for MongoDB
export const stockDataCollectionConfig = {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'symbol',
    granularity: 'minutes'
  }
};
