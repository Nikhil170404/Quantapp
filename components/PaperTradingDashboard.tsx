'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  ShoppingCart,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface Position {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  side: 'long' | 'short';
  openDate: string;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  shares: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: string;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  shares: number;
  price: number;
  commission: number;
  total: number;
  timestamp: string;
}

interface PortfolioData {
  cash: number;
  equity: number;
  positions: Position[];
  openOrders: Order[];
  tradeHistory: Trade[];
  performance: {
    totalReturn: number;
    totalReturnPercent: number;
    dayReturn: number;
    dayReturnPercent: number;
    totalCommissions: number;
    totalTrades: number;
    winRate: number;
    profitFactor: number;
  };
}

export default function PaperTradingDashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({
    symbol: '',
    side: 'buy' as 'buy' | 'sell',
    shares: '',
    price: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/paper-trading/portfolio?userId=default');
      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.portfolio);
      }
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/paper-trading/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default',
          action: tradeForm.side,
          symbol: tradeForm.symbol,
          shares: parseInt(tradeForm.shares),
          price: parseFloat(tradeForm.price),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      setPortfolio(data.portfolio);
      setShowTradeModal(false);
      setTradeForm({ symbol: '', side: 'buy', shares: '', price: '' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Card>
    );
  }

  if (!portfolio) {
    return (
      <Card className="mb-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Failed to load portfolio</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card title="📊 Paper Trading Portfolio" subtitle="Virtual trading with real market data">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Total Equity</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.equity)}</p>
            <p className={`text-sm mt-1 ${portfolio.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(portfolio.performance.totalReturnPercent)}
            </p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Available Cash</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.cash)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {((portfolio.cash / portfolio.equity) * 100).toFixed(1)}% of equity
            </p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Day P&L</p>
            <p className={`text-2xl font-bold ${portfolio.performance.dayReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(portfolio.performance.dayReturn)}
            </p>
            <p className={`text-sm mt-1 ${portfolio.performance.dayReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(portfolio.performance.dayReturnPercent)}
            </p>
          </div>

          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-white">{portfolio.performance.winRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {portfolio.performance.totalTrades} total trades
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowTradeModal(true)}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Place Trade
          </button>
          <button
            onClick={loadPortfolio}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'positions'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Positions ({portfolio.positions.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'orders'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Orders ({portfolio.openOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            History ({portfolio.tradeHistory.length})
          </button>
        </div>

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div className="overflow-x-auto">
            {portfolio.positions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No open positions</p>
                <p className="text-sm text-gray-500 mt-2">Place your first trade to get started</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Symbol</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Shares</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Avg Price</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Current</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Value</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((position) => (
                    <tr key={position.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-medium text-white">{position.symbol}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{position.shares}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{formatCurrency(position.avgPrice)}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{formatCurrency(position.currentPrice)}</td>
                      <td className="py-3 px-4 text-right text-white font-medium">{formatCurrency(position.marketValue)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${position.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(position.unrealizedPnL)}
                        <span className="text-xs ml-2">({formatPercent(position.unrealizedPnLPercent)})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            {portfolio.openOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending orders</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Symbol</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Side</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Shares</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.openOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-800/50">
                      <td className="py-3 px-4 font-medium text-white">{order.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 capitalize">{order.type}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{order.shares}</td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {order.price ? formatCurrency(order.price) : 'Market'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            {portfolio.tradeHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No trade history</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Symbol</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Side</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Shares</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Price</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.tradeHistory.slice().reverse().map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-800/50">
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{trade.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          trade.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">{trade.shares}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{formatCurrency(trade.price)}</td>
                      <td className="py-3 px-4 text-right text-white font-medium">{formatCurrency(trade.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      {/* Trade Modal */}
      {showTradeModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowTradeModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Place Trade</h2>
              <button onClick={() => setShowTradeModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <input
                  type="text"
                  value={tradeForm.symbol}
                  onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., NSE_EQ|INE002A01018"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Side</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTradeForm({ ...tradeForm, side: 'buy' })}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      tradeForm.side === 'buy'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeForm({ ...tradeForm, side: 'sell' })}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      tradeForm.side === 'sell'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Shares</label>
                <input
                  type="number"
                  value={tradeForm.shares}
                  onChange={(e) => setTradeForm({ ...tradeForm, shares: e.target.value })}
                  placeholder="Number of shares"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={tradeForm.price}
                  onChange={(e) => setTradeForm({ ...tradeForm, price: e.target.value })}
                  placeholder="Price per share"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <button
                onClick={handleTrade}
                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                Execute Trade
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}