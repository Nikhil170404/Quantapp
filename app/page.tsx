'use client';

import { useState, useEffect } from 'react';
import StockChart from '@/components/charts/StockChart';
import StockList from '@/components/tables/StockList';
import { Card, CardGrid } from '@/components/ui/Card';
import { formatCurrency, formatNumber, getRiskColor, getSignalColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';

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

export default function Home() {
  const [screenerData, setScreenerData] = useState<ScreenerData | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [error, setError] = useState<string>('');

  // Fetch screener data
  useEffect(() => {
    fetchScreenerData();
  }, []);

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
      // Set empty data structure to prevent UI errors
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
      }
    } catch (error: any) {
      console.error('Error fetching stock signal:', error);
      setError(error.message || 'Failed to fetch stock data');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol) {
      fetchStockSignal(searchSymbol);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-8 h-8 text-primary-500" />
                QuantApp
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time quantitative trading signals
              </p>
            </div>
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  placeholder="Search symbol..."
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Analyze
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {!loading && screenerData && (
          <CardGrid className="mb-8">
            <Card className="border-l-4 border-l-green-500">
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

            <Card className="border-l-4 border-l-red-500">
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

            <Card className="border-l-4 border-l-blue-500">
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
          <Card title="Risk Distribution" className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Low Risk</p>
                <p className="text-2xl font-bold text-green-500">{screenerData.byRisk.low}</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-500">{screenerData.byRisk.medium}</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">High Risk</p>
                <p className="text-2xl font-bold text-orange-500">{screenerData.byRisk.high}</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Extreme Risk</p>
                <p className="text-2xl font-bold text-red-500">{screenerData.byRisk.extreme}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stock Details */}
        {stockData && stockData.signal && (
          <Card title={`${selectedStock} - Signal Analysis`} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
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
                    <p className="text-lg font-semibold text-white mt-1">
                      {stockData.signal.confidence?.toFixed(0)}%
                    </p>
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
                    <p className="text-lg font-semibold text-white mt-1">
                      {stockData.signal.riskScore.score.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Price Levels</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Entry</p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(stockData.signal.entryPrice)}
                      </p>
                    </div>
                    {stockData.signal.targetPrice && (
                      <div>
                        <p className="text-xs text-gray-500">Target</p>
                        <p className="text-lg font-semibold text-green-500">
                          {formatCurrency(stockData.signal.targetPrice)}
                        </p>
                      </div>
                    )}
                    {stockData.signal.stopLoss && (
                      <div>
                        <p className="text-xs text-gray-500">Stop Loss</p>
                        <p className="text-lg font-semibold text-red-500">
                          {formatCurrency(stockData.signal.stopLoss)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Technical Indicators</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">RSI (14)</p>
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
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">MACD</p>
                      <p className="text-lg font-semibold text-white">
                        {stockData.signal.indicators.macd.histogram.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Volume Ratio</p>
                      <p className="text-lg font-semibold text-white">
                        {stockData.signal.indicators.volumeRatio.toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Signal Reasons</h4>
                <ul className="space-y-2">
                  {stockData.signal.reasons.map((reason: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <AlertCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Buy Signals Table */}
        {!loading && screenerData && screenerData.groups.buySignals.length > 0 && (
          <Card title="Top Buy Signals" subtitle="Sorted by confidence" className="mb-8">
            <StockList
              stocks={screenerData.groups.buySignals.slice(0, 10)}
              onStockClick={fetchStockSignal}
            />
          </Card>
        )}

        {/* Low Risk Opportunities */}
        {!loading && screenerData && screenerData.groups.lowRisk.length > 0 && (
          <Card title="Low Risk Opportunities" subtitle="Conservative picks" className="mb-8">
            <StockList
              stocks={screenerData.groups.lowRisk.slice(0, 10)}
              onStockClick={fetchStockSignal}
            />
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-l-4 border-l-red-500">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
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
            QuantApp - Quantitative Trading Dashboard. Data provided by Upstox API.
          </p>
        </div>
      </footer>
    </div>
  );
}
