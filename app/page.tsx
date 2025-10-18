'use client';

import { useState, useEffect } from 'react';
import { Card, CardGrid } from '@/components/ui/Card';
import StockList from '@/components/tables/StockList';
import NewsCard from '@/components/cards/NewsCard';
import AddCustomStock from '@/components/AddCustomStock';
import { formatCurrency, formatNumber, getRiskColor, getSignalColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw, Zap, Clock, BarChart3, Filter, X } from 'lucide-react';
import { NIFTY50_STOCKS, getMarketStatus, getAllSectors } from '@/lib/constants/nifty50';

interface StockSignal {
  symbol: string;
  name: string;
  shortName: string;
  sector: string;
  signal: any;
  timestamp: string;
  cached?: boolean;
  isCustom?: boolean;
}

interface NewsData {
  companyName: string;
  shortName: string;
  sector: string;
  news: any[];
  overallSentiment: 'positive' | 'negative' | 'neutral';
  avgSentimentScore: number;
}

export default function Home() {
  const [allStocks, setAllStocks] = useState<StockSignal[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockSignal[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSignal | null>(null);
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // Filters
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'HOLD'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  
  // Market status
  const marketStatus = getMarketStatus();
  const allSectors = ['ALL', ...getAllSectors()];

  // Statistics
  const stats = {
    total: allStocks.length,
    buySignals: allStocks.filter(s => s.signal?.type === 'BUY').length,
    sellSignals: allStocks.filter(s => s.signal?.type === 'SELL').length,
    holdSignals: allStocks.filter(s => s.signal?.type === 'HOLD').length,
    lowRisk: allStocks.filter(s => s.signal?.riskScore?.level === 'LOW').length,
    mediumRisk: allStocks.filter(s => s.signal?.riskScore?.level === 'MEDIUM').length,
    highRisk: allStocks.filter(s => s.signal?.riskScore?.level === 'HIGH').length,
    extremeRisk: allStocks.filter(s => s.signal?.riskScore?.level === 'EXTREME').length,
  };

  // Load all stocks on mount
  useEffect(() => {
    loadAllStocks();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...allStocks];

    // Signal filter
    if (signalFilter !== 'ALL') {
      filtered = filtered.filter(s => s.signal?.type === signalFilter);
    }

    // Risk filter
    if (riskFilter !== 'ALL') {
      filtered = filtered.filter(s => s.signal?.riskScore?.level === riskFilter);
    }

    // Sector filter
    if (sectorFilter !== 'ALL') {
      filtered = filtered.filter(s => s.sector === sectorFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.shortName.toLowerCase().includes(query) ||
        s.symbol.toLowerCase().includes(query) ||
        s.sector.toLowerCase().includes(query)
      );
    }

    setFilteredStocks(filtered);
  }, [allStocks, signalFilter, riskFilter, sectorFilter, searchQuery]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (marketStatus.isOpen) {
        loadAllStocks();
      }
    }, 60000); // Refresh every minute when market is open

    return () => clearInterval(interval);
  }, [autoRefresh, marketStatus.isOpen]);

  const loadAllStocks = async () => {
    try {
      setLoading(true);
      setProcessingStatus('Checking existing data...');
      
      // First, try to get existing data
      const response = await fetch('/api/stocks/nifty50');
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('Loaded data:', data);
        
        if (data.total > 0) {
          // We have data, display it
          const allSignals = [...(data.topBuy || []), ...(data.topSell || [])];
          setAllStocks(allSignals);
          setLastUpdated(data.lastUpdate ? new Date(data.lastUpdate) : new Date());
          setProcessingStatus('');
        } else {
          // No data, need to trigger batch processing
          setProcessingStatus('No data found. Starting batch processing...');
          await triggerBatchProcess();
        }
      } else {
        setProcessingStatus('Failed to load data. Starting batch processing...');
        await triggerBatchProcess();
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
      setProcessingStatus('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerBatchProcess = async () => {
    try {
      setBatchLoading(true);
      setProcessingStatus('Processing all 50 Nifty stocks... This may take a few minutes.');
      
      const response = await fetch('/api/stocks/nifty50', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Batch processing complete:', data);
        
        if (data.results && data.results.length > 0) {
          setAllStocks(data.results);
          setLastUpdated(new Date());
          setProcessingStatus(`Successfully processed ${data.results.length} stocks!`);
          
          // Clear status after 3 seconds
          setTimeout(() => setProcessingStatus(''), 3000);
        } else {
          setProcessingStatus(`Batch processing completed but no stocks were processed. ${data.errorDetails?.length || 0} errors occurred.`);
        }
      } else {
        const errorData = await response.json();
        setProcessingStatus(`Batch processing failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Batch processing error:', error);
      setProcessingStatus(`Error: ${error.message || 'Failed to process stocks'}`);
    } finally {
      setBatchLoading(false);
    }
  };

  const fetchStockNews = async (symbol: string) => {
    try {
      setNewsLoading(true);
      
      const response = await fetch(`/api/scraper/news?symbol=${encodeURIComponent(symbol)}&maxResults=5`);
      
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

  const handleStockClick = (symbol: string) => {
    const stock = allStocks.find(s => s.symbol === symbol);
    if (stock) {
      setSelectedStock(stock);
      fetchStockNews(symbol);
    }
  };

  const clearFilters = () => {
    setSignalFilter('ALL');
    setRiskFilter('ALL');
    setSectorFilter('ALL');
    setSearchQuery('');
  };

  const handleStockAdded = () => {
    // Reload stocks when a new custom stock is added
    loadAllStocks();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-8 h-8 text-primary-500" />
                QuantApp - Nifty 50 Dashboard
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time analysis of all 50 Nifty stocks with AI insights
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Market Status */}
              <div className={`px-4 py-2 rounded-lg border ${
                marketStatus.isOpen 
                  ? 'border-green-600/50 bg-green-600/10 text-green-400'
                  : 'border-red-600/50 bg-red-600/10 text-red-400'
              }`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {marketStatus.message}
                </div>
                {marketStatus.nextOpenTime && (
                  <div className="text-xs text-gray-500 mt-1">
                    Next: {marketStatus.nextOpenTime}
                  </div>
                )}
              </div>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                disabled={!marketStatus.isOpen}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                  autoRefresh
                    ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                    : 'bg-gray-800 text-gray-300 border border-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Zap className="w-4 h-4" />
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>

              {/* Refresh Button */}
              <button
                onClick={loadAllStocks}
                disabled={batchLoading || loading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${(batchLoading || loading) ? 'animate-spin' : ''}`} />
                {batchLoading ? 'Processing...' : loading ? 'Loading...' : 'Refresh All'}
              </button>
            </div>
          </div>

          {lastUpdated && (
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}

          {/* Processing Status */}
          {processingStatus && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400 flex items-center gap-2">
                {(batchLoading || loading) && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                {processingStatus}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <CardGrid className="mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Stocks</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {allStocks.filter(s => s.isCustom).length > 0 && 
                    `Including ${allStocks.filter(s => s.isCustom).length} custom`
                  }
                </p>
              </div>
              <Activity className="w-12 h-12 text-blue-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Buy Signals</p>
                <p className="text-3xl font-bold text-green-500 mt-2">{stats.buySignals}</p>
                <p className="text-xs text-gray-500 mt-1">Strong opportunities</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sell Signals</p>
                <p className="text-3xl font-bold text-red-500 mt-2">{stats.sellSignals}</p>
                <p className="text-xs text-gray-500 mt-1">Exit warnings</p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-500" />
            </div>
          </Card>
        </CardGrid>

        {/* Risk Distribution */}
        <Card title="📊 Risk Distribution" className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Low Risk</p>
              <p className="text-3xl font-bold text-green-500">{stats.lowRisk}</p>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-500">{stats.mediumRisk}</p>
            </div>
            <div className="text-center p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">High Risk</p>
              <p className="text-3xl font-bold text-orange-500">{stats.highRisk}</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Extreme Risk</p>
              <p className="text-3xl font-bold text-red-500">{stats.extremeRisk}</p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card title="🔍 Filter & Search" className="mb-8">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Search Stocks</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, symbol, or sector..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Signal Filter */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Signal Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(['ALL', 'BUY', 'SELL', 'HOLD'] as const).map(sig => (
                    <button
                      key={sig}
                      onClick={() => setSignalFilter(sig)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        signalFilter === sig
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {sig}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Filter */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Risk Level</label>
                <div className="flex gap-2 flex-wrap">
                  {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map(risk => (
                    <button
                      key={risk}
                      onClick={() => setRiskFilter(risk)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        riskFilter === risk
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sector Filter */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Sector</label>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {allSectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(signalFilter !== 'ALL' || riskFilter !== 'ALL' || sectorFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        </Card>

        {/* Selected Stock Details */}
        {selectedStock && selectedStock.signal && (
          <Card title={`📈 ${selectedStock.shortName} - Detailed Analysis`} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {/* Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Signal</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getSignalColor(selectedStock.signal.type)}`}>
                      {selectedStock.signal.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Confidence</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {selectedStock.signal.confidence?.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Risk Level</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getRiskColor(selectedStock.signal.riskScore?.level)}`}>
                      {selectedStock.signal.riskScore?.level}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Sector</p>
                    <p className="text-sm font-semibold text-white mt-1">{selectedStock.sector}</p>
                  </div>
                </div>

                {/* Price Levels */}
                <div className="border-t border-gray-800 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">💰 Price Levels</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Entry</p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(selectedStock.signal.entryPrice)}
                      </p>
                    </div>
                    {selectedStock.signal.targetPrice && (
                      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                        <p className="text-xs text-gray-500 mb-1">Target</p>
                        <p className="text-lg font-semibold text-green-500">
                          {formatCurrency(selectedStock.signal.targetPrice)}
                        </p>
                      </div>
                    )}
                    {selectedStock.signal.stopLoss && (
                      <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                        <p className="text-xs text-gray-500 mb-1">Stop Loss</p>
                        <p className="text-lg font-semibold text-red-500">
                          {formatCurrency(selectedStock.signal.stopLoss)}
                        </p>
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
                      <p className={`text-lg font-semibold ${
                        selectedStock.signal.indicators.rsi > 70 ? 'text-red-500' :
                        selectedStock.signal.indicators.rsi < 30 ? 'text-green-500' :
                        'text-white'
                      }`}>
                        {selectedStock.signal.indicators.rsi.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">MACD</p>
                      <p className={`text-lg font-semibold ${
                        selectedStock.signal.indicators.macd.histogram > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}>
                        {selectedStock.signal.indicators.macd.histogram.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Volume Ratio</p>
                      <p className="text-lg font-semibold text-white">
                        {selectedStock.signal.indicators.volumeRatio.toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signal Reasons */}
              <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Signal Reasons
                </h4>
                <ul className="space-y-2">
                  {selectedStock.signal.reasons.map((reason: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-primary-500 mt-0.5">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* News Section */}
        {selectedStock && newsData && (
          <Card title={`📰 Latest News - ${newsData.shortName}`} className="mb-8">
            {newsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : newsData.news && newsData.news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-4 md:col-span-2">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Market Sentiment</h4>
                  <div className="flex items-center gap-4">
                    <p className="text-3xl font-bold text-blue-500">
                      {newsData.overallSentiment?.charAt(0).toUpperCase() + newsData.overallSentiment?.slice(1)}
                    </p>
                    <p className="text-sm text-gray-400">
                      Score: {newsData.avgSentimentScore?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {newsData.news.slice(0, 4).map((item: any, index: number) => (
                  <NewsCard key={index} news={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No news available</p>
              </div>
            )}
          </Card>
        )}

        {/* All Stocks Table */}
        <Card 
          title={`📊 ${filteredStocks.length === allStocks.length ? 'All' : 'Filtered'} Stocks`}
          subtitle={`Showing ${filteredStocks.length} of ${allStocks.length} stocks`}
        >
          {batchLoading || loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-gray-400">
                {batchLoading ? 'Processing Nifty 50 stocks...' : 'Loading stocks...'}
              </p>
              {batchLoading && (
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few minutes for the first time
                </p>
              )}
            </div>
          ) : filteredStocks.length > 0 ? (
            <StockList
              stocks={filteredStocks}
              onStockClick={handleStockClick}
            />
          ) : allStocks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No stocks data available</p>
              <button
                onClick={triggerBatchProcess}
                disabled={batchLoading}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className={`w-5 h-5 ${batchLoading ? 'animate-spin' : ''}`} />
                {batchLoading ? 'Processing...' : 'Process All Stocks'}
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4">No stocks match your filters</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </Card>
      </main>

      {/* Add Custom Stock Floating Button */}
      <AddCustomStock onStockAdded={handleStockAdded} />

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            QuantApp - Nifty 50 Quantitative Trading Dashboard | Real-time market data & AI-powered insights
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            Data: Upstox API | News: Web Search | Analysis: Advanced Technical Indicators
          </p>
        </div>
      </footer>
    </div>
  );
}