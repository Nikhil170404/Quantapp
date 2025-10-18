'use client';

import { useState, useEffect } from 'react';
import StockChart from '@/components/charts/StockChart';
import StockList from '@/components/tables/StockList';
import NewsCard from '@/components/cards/NewsCard';
import { Card, CardGrid } from '@/components/ui/Card';
import { formatCurrency, formatNumber, getRiskColor, getSignalColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw, TrendingUp as TrendingUpIcon, Zap, User } from 'lucide-react';

interface ScreenerData {
  total: number;
  byRisk: {
    low: number;
    medium: number;
    high: number;
    extreme: number;
  };
  bySignal: {
    buy: number;
    sell: number;
  };
  groups: {
    buySignals: any[];
    sellSignals: any[];
    lowRisk: any[];
    mediumRisk: any[];
  };
}

interface NewsItem {
  title: string;
  snippet: string;
  url?: string;
  source?: string;
  timestamp: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}

export default function Home() {
  const [screenerData, setScreenerData] = useState<ScreenerData | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<any>(null);
  const [newsData, setNewsData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch screener data
  useEffect(() => {
    fetchScreenerData();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !selectedStock) return;

    const interval = setInterval(() => {
      fetchStockSignal(selectedStock);
      fetchStockNews(selectedStock);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedStock]);

  const fetchScreenerData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/screener');
      if (!response.ok) {
        throw new Error('Failed to fetch screener data');
      }
      const data = await response.json();
      setScreenerData(data);
    } catch (error) {
      console.error('Error fetching screener data:', error);
      setScreenerData({
        total: 0,
        byRisk: { low: 0, medium: 0, high: 0, extreme: 0 },
        bySignal: { buy: 0, sell: 0 },
        groups: {
          buySignals: [],
          sellSignals: [],
          lowRisk: [],
          mediumRisk: [],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSignal = async (symbol: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/stocks/signals?symbol=${symbol}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stock signal');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStockData(null);
      } else {
        setStockData(data);
        setSelectedStock(symbol);
        setLastUpdated(new Date());
      }
    } catch (error: any) {
      console.error('Error fetching stock signal:', error);
      setError(error.message || 'Failed to fetch stock data');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockNews = async (symbol: string) => {
    try {
      setNewsLoading(true);
      // Extract just the symbol name for news search
      const symbolName = symbol.split('|')[1]?.substring(0, 4) || symbol;
      
      const response = await fetch(`/api/scraper/news?symbol=${symbolName}&maxResults=5`);
      
      if (response.ok) {
        const data = await response.json();
        setNewsData(data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchHistoricalData = async (symbol: string) => {
    try {
      const response = await fetch(`/api/stocks/historical?symbol=${symbol}&days=30`);
      
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol) {
      fetchStockSignal(searchSymbol);
      fetchStockNews(searchSymbol);
      fetchHistoricalData(searchSymbol);
    }
  };

  const handleRefresh = () => {
    if (selectedStock) {
      fetchStockSignal(selectedStock);
      fetchStockNews(selectedStock);
      fetchHistoricalData(selectedStock);
    }
  };

  // Calculate trend
  const calculateTrend = (data: any) => {
    if (!data || !data.signal) return null;
    const currentPrice = data.signal.entryPrice;
    const targetPrice = data.signal.targetPrice;
    if (!targetPrice) return null;
    const change = ((targetPrice - currentPrice) / currentPrice) * 100;
    return change;
  };

  const trend = calculateTrend(stockData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-8 h-8 text-primary-500" />
                QuantApp
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time quantitative trading signals with AI insights
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  placeholder="e.g., NSE_EQ|INE002A01018"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-80"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  Analyze
                </button>
              </form>
              
              {selectedStock && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                      autoRefresh
                        ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Live: {autoRefresh ? 'ON' : 'OFF'}
                  </button>
                  
                  <div className="text-xs text-gray-500">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {!loading && screenerData && (
          <CardGrid className="mb-8">
            <Card className="border-l-4 border-l-green-500 hover:border-l-green-400 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Buy Signals</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {screenerData.bySignal.buy}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-red-500 hover:border-l-red-400 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Sell Signals</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {screenerData.bySignal.sell}
                  </p>
                </div>
                <TrendingDown className="w-12 h-12 text-red-500" />
              </div>
            </Card>

            <Card className="border-l-4 border-l-blue-500 hover:border-l-blue-400 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Signals</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {screenerData.total}
                  </p>
                </div>
                <Activity className="w-12 h-12 text-blue-500" />
              </div>
            </Card>
          </CardGrid>
        )}

        {/* Risk Distribution */}
        {!loading && screenerData && (
          <Card title="📊 Risk Distribution by Level" className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-colors">
                <p className="text-sm text-gray-400 mb-2">Low Risk</p>
                <p className="text-3xl font-bold text-green-500">{screenerData.byRisk.low}</p>
                <p className="text-xs text-gray-500 mt-1">Safe trades</p>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:border-yellow-500/50 transition-colors">
                <p className="text-sm text-gray-400 mb-2">Medium Risk</p>
                <p className="text-3xl font-bold text-yellow-500">{screenerData.byRisk.medium}</p>
                <p className="text-xs text-gray-500 mt-1">Balanced</p>
              </div>
              <div className="text-center p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:border-orange-500/50 transition-colors">
                <p className="text-sm text-gray-400 mb-2">High Risk</p>
                <p className="text-3xl font-bold text-orange-500">{screenerData.byRisk.high}</p>
                <p className="text-xs text-gray-500 mt-1">Aggressive</p>
              </div>
              <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg hover:border-red-500/50 transition-colors">
                <p className="text-sm text-gray-400 mb-2">Extreme Risk</p>
                <p className="text-3xl font-bold text-red-500">{screenerData.byRisk.extreme}</p>
                <p className="text-xs text-gray-500 mt-1">High caution</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stock Details & Analysis */}
        {stockData && stockData.signal && (
          <Card title={`📈 ${selectedStock} - Signal Analysis`} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {/* Signal Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Signal</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getSignalColor(
                        stockData.signal.type
                      )}`}
                    >
                      {stockData.signal.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Confidence</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stockData.signal.confidence >= 70
                              ? 'bg-green-500'
                              : stockData.signal.confidence >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${stockData.signal.confidence}%` }}
                        ></div>
                      </div>
                      <p className="text-lg font-semibold text-white w-12">
                        {stockData.signal.confidence?.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Risk Level</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getRiskColor(
                        stockData.signal.riskScore?.level
                      )}`}
                    >
                      {stockData.signal.riskScore?.level}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Risk Score</p>
                    <p className={`text-lg font-semibold mt-1 ${
                      stockData.signal.riskScore.score < 30 ? 'text-green-500' :
                      stockData.signal.riskScore.score < 60 ? 'text-yellow-500' :
                      stockData.signal.riskScore.score < 80 ? 'text-orange-500' :
                      'text-red-500'
                    }`}>
                      {stockData.signal.riskScore.score.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Price Levels */}
                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">💰 Price Levels & Targets</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Entry Price</p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(stockData.signal.entryPrice)}
                      </p>
                    </div>
                    {stockData.signal.targetPrice && (
                      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                        <p className="text-xs text-gray-500 mb-1">Target Price</p>
                        <p className="text-lg font-semibold text-green-500">
                          {formatCurrency(stockData.signal.targetPrice)}
                        </p>
                        {trend && (
                          <p className="text-xs text-green-400 mt-1">
                            +{trend.toFixed(2)}% potential
                          </p>
                        )}
                      </div>
                    )}
                    {stockData.signal.stopLoss && (
                      <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                        <p className="text-xs text-gray-500 mb-1">Stop Loss</p>
                        <p className="text-lg font-semibold text-red-500">
                          {formatCurrency(stockData.signal.stopLoss)}
                        </p>
                        {trend && (
                          <p className="text-xs text-red-400 mt-1">
                            {(((stockData.signal.stopLoss - stockData.signal.entryPrice) / stockData.signal.entryPrice) * 100).toFixed(2)}%
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Indicators */}
                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">📊 Technical Indicators</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">RSI (14)</p>
                      <p
                        className={`text-lg font-semibold ${
                          stockData.signal.indicators.rsi > 70
                            ? 'text-red-500'
                            : stockData.signal.indicators.rsi < 30
                            ? 'text-green-500'
                            : 'text-white'
                        }`}
                      >
                        {stockData.signal.indicators.rsi.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stockData.signal.indicators.rsi > 70 ? 'Overbought' :
                         stockData.signal.indicators.rsi < 30 ? 'Oversold' :
                         'Neutral'}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">MACD Histogram</p>
                      <p
                        className={`text-lg font-semibold ${
                          stockData.signal.indicators.macd.histogram > 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {stockData.signal.indicators.macd.histogram.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stockData.signal.indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Volume Ratio</p>
                      <p className="text-lg font-semibold text-white">
                        {stockData.signal.indicators.volumeRatio.toFixed(2)}x
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stockData.signal.indicators.volumeRatio > 1.5 ? 'Above Average' : 'Normal'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Breakdown */}
                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">⚠️ Risk Breakdown</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-gray-500">Volatility Risk</p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {stockData.signal.riskScore.breakdown.volatilityRisk.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-gray-500">Volume Risk</p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {stockData.signal.riskScore.breakdown.volumeRisk.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-gray-500">Price Risk</p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {stockData.signal.riskScore.breakdown.priceRisk.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signal Reasons & Expert Tips */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-primary-400 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Signal Reasons
                  </h4>
                  <ul className="space-y-2">
                    {stockData.signal.reasons.map((reason: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                        <AlertCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Expert Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>✓ Risk-Reward: 1:{stockData.signal.riskReward?.toFixed(2) || 'N/A'}</li>
                    <li>✓ Position Size: {
                      stockData.signal.riskScore.level === 'LOW' ? 'LARGE (Conservative)' :
                      stockData.signal.riskScore.level === 'MEDIUM' ? 'MEDIUM (Balanced)' :
                      'SMALL (Aggressive)'
                    }</li>
                    <li>✓ Volatility: {stockData.signal.riskScore.volatility.toFixed(2)}%</li>
                    <li>✓ Trend: {stockData.signal.type === 'BUY' ? '📈 Bullish' : '📉 Bearish'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* News Section */}
        {selectedStock && (
          <Card title="📰 Latest News & Market Sentiment" className="mb-8">
            {newsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : newsData && newsData.news && newsData.news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overall Sentiment */}
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-4 md:col-span-2">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Market Sentiment</h4>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-3xl font-bold text-blue-500">
                        {newsData.overallSentiment?.charAt(0).toUpperCase() + newsData.overallSentiment?.slice(1)}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Avg Sentiment: {newsData.avgSentimentScore?.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            newsData.overallSentiment === 'positive'
                              ? 'bg-green-500'
                              : newsData.overallSentiment === 'negative'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                          }`}
                          style={{
                            width: `${((newsData.avgSentimentScore + 1) / 2) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* News Items */}
                {newsData.news.slice(0, 4).map((item: any, index: number) => (
                  <NewsCard key={index} news={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No news available for this symbol</p>
              </div>
            )}
          </Card>
        )}

        {/* Buy Signals Table */}
        {!loading && screenerData && screenerData.groups.buySignals.length > 0 && (
          <Card title="🟢 Top Buy Signals" subtitle="Sorted by confidence" className="mb-8">
            <StockList
              stocks={screenerData.groups.buySignals.slice(0, 10)}
              onStockClick={fetchStockSignal}
            />
          </Card>
        )}

        {/* Low Risk Opportunities */}
        {!loading && screenerData && screenerData.groups.lowRisk.length > 0 && (
          <Card title="🛡️ Low Risk Opportunities" subtitle="Conservative picks" className="mb-8">
            <StockList
              stocks={screenerData.groups.lowRisk.slice(0, 10)}
              onStockClick={fetchStockSignal}
            />
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-l-4 border-l-red-500 bg-red-500/10">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-white">Error</h3>
                <p className="text-gray-400 mt-1">{error}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try a different stock symbol or check your Upstox API credentials.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            QuantApp - Quantitative Trading Dashboard | Data by Upstox API | News by DuckDuckGo
          </p>
        </div>
      </footer>
    </div>
  );
}