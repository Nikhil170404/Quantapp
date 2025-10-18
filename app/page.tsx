'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import StockAnalysisCard from '@/components/cards/StockAnalysisCard';
import { Search, TrendingUp, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { NIFTY50_STOCKS, getMarketStatus } from '@/lib/constants/nifty50';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const marketStatus = getMarketStatus();

  // Filter stocks based on search
  const filteredStocks = searchQuery
    ? NIFTY50_STOCKS.filter(
        (stock) =>
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary-500" />
                QuantApp - Advanced Stock Analysis
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time analysis with technical indicators, news sentiment & expert insights
              </p>
            </div>
            
            <div className={`px-4 py-2 rounded-lg border ${
              marketStatus.isOpen 
                ? 'border-green-600/50 bg-green-600/10 text-green-400'
                : 'border-red-600/50 bg-red-600/10 text-red-400'
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                {marketStatus.message}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks by name (e.g., Reliance, HDFC Bank, TCS)..."
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
            />
          </div>

          {/* Search Results Dropdown */}
          {filteredStocks.length > 0 && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <p className="text-sm text-gray-400 mb-3">Search Results ({filteredStocks.length})</p>
              <div className="grid gap-2">
                {filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleStockSelect(stock.symbol)}
                    className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-white">{stock.shortName}</p>
                      <p className="text-sm text-gray-400">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{stock.sector}</p>
                      <TrendingUp className="w-5 h-5 text-primary-500 ml-auto mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {searchQuery && filteredStocks.length === 0 && (
            <div className="mt-4 text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No stocks found matching "{searchQuery}"</p>
              <p className="text-sm text-gray-500 mt-2">Try searching for: Reliance, HDFC, TCS, Infosys, etc.</p>
            </div>
          )}
        </Card>

        {/* Popular Stocks Quick Access */}
        {!selectedStock && !searchQuery && (
          <Card title="🔥 Popular Stocks" subtitle="Click to analyze" className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {['Reliance', 'HDFC Bank', 'TCS', 'Infosys', 'ICICI Bank', 'SBI', 'Bajaj Finance', 'ITC', 'L&T', 'Axis Bank']
                .map((name) => {
                  const stock = NIFTY50_STOCKS.find(s => s.shortName === name);
                  return stock ? (
                    <button
                      key={stock.symbol}
                      onClick={() => handleStockSelect(stock.symbol)}
                      className="p-4 bg-gradient-to-br from-primary-600/20 to-primary-800/10 hover:from-primary-600/30 hover:to-primary-800/20 border border-primary-500/30 rounded-lg transition-all hover:scale-105"
                    >
                      <p className="font-semibold text-white text-sm">{stock.shortName}</p>
                      <p className="text-xs text-gray-400 mt-1">{stock.sector}</p>
                    </button>
                  ) : null;
                })}
            </div>
          </Card>
        )}

        {/* Stock Analysis */}
        {selectedStock && (
          <StockAnalysisCard 
            symbol={selectedStock} 
            onClose={() => setSelectedStock(null)}
          />
        )}

        {/* Info Cards */}
        {!selectedStock && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Search className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Search & Analyze</h3>
                  <p className="text-sm text-gray-400">
                    Search any Nifty 50 stock and get comprehensive analysis with technical indicators, news, and trading signals.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Real-time Signals</h3>
                  <p className="text-sm text-gray-400">
                    Get buy/sell signals based on RSI, MACD, Bollinger Bands, volume analysis and more technical indicators.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">News & Sentiment</h3>
                  <p className="text-sm text-gray-400">
                    Latest news with AI sentiment analysis and expert opinions from web sources for better decision making.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            QuantApp - Advanced Quantitative Trading Platform | Powered by Upstox API & AI Analysis
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            ⚠️ For educational purposes only. Not financial advice. Always do your own research.
          </p>
        </div>
      </footer>
    </div>
  );
}