'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import NewsCard from '@/components/cards/NewsCard';
import { getStockInfo } from '@/lib/constants/nifty50';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  Target,
  Shield,
  Activity,
  BarChart3,
  Newspaper,
  Globe,
  Clock
} from 'lucide-react';
import { formatCurrency, getRiskColor, getSignalColor } from '@/lib/utils';

interface StockAnalysisCardProps {
  symbol: string;
  onClose: () => void;
}

export default function StockAnalysisCard({ symbol, onClose }: StockAnalysisCardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [newsData, setNewsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const stockInfo = getStockInfo(symbol);

  useEffect(() => {
    loadAnalysis();
    loadNews();
  }, [symbol]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stock analysis
      const response = await fetch(`/api/stocks/analyze?symbol=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analysis');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadNews = async () => {
    try {
      // Use company name for better news results
      const searchQuery = stockInfo?.name || symbol;
      const response = await fetch(`/api/scraper/news?symbol=${encodeURIComponent(symbol)}&maxResults=5`);
      
      if (response.ok) {
        const data = await response.json();
        setNewsData(data);
      }
    } catch (err) {
      console.error('News error:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAnalysis(), loadNews()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-400">Analyzing {stockInfo?.shortName || symbol}...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching data & calculating indicators</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-8">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-400 mb-2">Error loading analysis</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={loadAnalysis}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!analysisData) return null;

  const { signal, indicators, riskScore, prices, recommendation } = analysisData;

  return (
    <div className="space-y-6 mb-8">
      {/* Header Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{stockInfo?.shortName || symbol}</h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSignalColor(
                  signal?.type
                )}`}
              >
                {signal?.type} SIGNAL
              </span>
            </div>
            <p className="text-gray-400">{stockInfo?.name}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">{stockInfo?.sector}</span>
              <span className={`text-sm px-2 py-1 rounded ${getRiskColor(riskScore?.level)}`}>
                {riskScore?.level} RISK
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Price & Confidence */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Current Price</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(signal?.entryPrice || 0)}</p>
          </div>
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Confidence</p>
            <p className="text-2xl font-bold text-primary-500">{signal?.confidence?.toFixed(0)}%</p>
          </div>
          {signal?.targetPrice && (
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">Target Price</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(signal.targetPrice)}
              </p>
              <p className="text-xs text-green-400 mt-1">
                +{(((signal.targetPrice - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}%
              </p>
            </div>
          )}
          {signal?.stopLoss && (
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
              <p className="text-sm text-gray-400 mb-1">Stop Loss</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(signal.stopLoss)}
              </p>
              <p className="text-xs text-red-400 mt-1">
                {(((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Recommendation Card */}
      {recommendation && (
        <Card title="💡 Trading Recommendation" className="border-l-4 border-l-primary-500">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary-500/20 to-primary-600/10 p-4 rounded-lg border border-primary-500/30">
              <p className="text-lg font-semibold text-white mb-2">{recommendation.strategy}</p>
              <p className="text-gray-300">{recommendation.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Position Size</p>
                <p className="text-lg font-semibold text-white">{recommendation.positionSize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Holding Period</p>
                <p className="text-lg font-semibold text-white">{recommendation.timeframe}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Risk/Reward</p>
                <p className="text-lg font-semibold text-white">
                  1:{signal?.riskReward?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Technical Indicators */}
      <Card title="📊 Technical Indicators">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">RSI (14)</p>
            <p
              className={`text-2xl font-bold ${
                indicators?.rsi > 70
                  ? 'text-red-500'
                  : indicators?.rsi < 30
                  ? 'text-green-500'
                  : 'text-white'
              }`}
            >
              {indicators?.rsi?.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {indicators?.rsi > 70
                ? 'Overbought'
                : indicators?.rsi < 30
                ? 'Oversold'
                : 'Neutral'}
            </p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">MACD</p>
            <p
              className={`text-2xl font-bold ${
                indicators?.macd?.histogram > 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {indicators?.macd?.histogram?.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {indicators?.macd?.histogram > 0 ? 'Bullish' : 'Bearish'}
            </p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Volume Ratio</p>
            <p className="text-2xl font-bold text-white">
              {indicators?.volumeRatio?.toFixed(2)}x
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {indicators?.volumeRatio > 1.5 ? 'High Volume' : 'Normal'}
            </p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Bollinger %B</p>
            <p className="text-2xl font-bold text-white">
              {indicators?.bollingerBand?.percentB?.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {indicators?.bollingerBand?.signal || 'Neutral'}
            </p>
          </div>
        </div>

        {/* Signal Reasons */}
        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
          <h4 className="text-sm font-medium text-gray-400 mb-3">📝 Signal Analysis</h4>
          <ul className="space-y-2">
            {signal?.reasons?.map((reason: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-primary-500 mt-0.5">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Risk Analysis */}
      <Card title="🛡️ Risk Assessment">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Risk Score</p>
            <p className="text-2xl font-bold text-white">{riskScore?.score?.toFixed(0)}/100</p>
            <p className={`text-xs mt-1 ${getRiskColor(riskScore?.level).split(' ')[0]}`}>
              {riskScore?.level}
            </p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Volatility</p>
            <p className="text-2xl font-bold text-white">{riskScore?.volatility?.toFixed(2)}%</p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Volume Risk</p>
            <p className="text-2xl font-bold text-white">
              {riskScore?.breakdown?.volumeRisk?.toFixed(0)}
            </p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Price Deviation</p>
            <p className="text-2xl font-bold text-white">
              {riskScore?.priceDeviation?.toFixed(2)}%
            </p>
          </div>
        </div>
      </Card>

      {/* News & Sentiment */}
      {newsData && newsData.news && newsData.news.length > 0 && (
        <Card title="📰 Latest News & Sentiment">
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Overall Market Sentiment</p>
                <p className="text-2xl font-bold text-blue-400 capitalize mt-1">
                  {newsData.overallSentiment}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Sentiment Score</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    newsData.avgSentimentScore > 0
                      ? 'text-green-400'
                      : newsData.avgSentimentScore < 0
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {newsData.avgSentimentScore?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newsData.news.slice(0, 4).map((item: any, index: number) => (
              <NewsCard key={index} news={item} />
            ))}
          </div>
        </Card>
      )}

      {/* Timestamp */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>Last updated: {new Date(analysisData.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
}