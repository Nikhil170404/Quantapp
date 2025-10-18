'use client';

import { formatCurrency, formatPercent, getRiskColor, getSignalColor } from '@/lib/utils';

interface Signal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  riskReward?: number;
  riskScore: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  };
  indicators: {
    rsi: number;
    macd: any;
    volumeRatio: number;
  };
}

interface StockData {
  symbol: string;
  signal: Signal;
  timestamp: string;
}

interface StockListProps {
  stocks: StockData[];
  onStockClick?: (symbol: string) => void;
}

export default function StockList({ stocks, onStockClick }: StockListProps) {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No stocks to display</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Symbol
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Signal
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Confidence
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Target
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Risk
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              RSI
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              R:R
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {stocks.map((stock, index) => (
            <tr
              key={index}
              onClick={() => onStockClick && onStockClick(stock.symbol)}
              className="hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-white">{stock.symbol}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSignalColor(
                    stock.signal.type
                  )}`}
                >
                  {stock.signal.type}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-full bg-gray-700 rounded-full h-2 mr-2" style={{ width: '60px' }}>
                    <div
                      className={`h-2 rounded-full ${
                        stock.signal.confidence >= 70
                          ? 'bg-green-500'
                          : stock.signal.confidence >= 50
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                      }`}
                      style={{ width: `${stock.signal.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-300">{stock.signal.confidence.toFixed(0)}%</span>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                {formatCurrency(stock.signal.entryPrice)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                {stock.signal.targetPrice ? (
                  <div>
                    <div>{formatCurrency(stock.signal.targetPrice)}</div>
                    <div className="text-xs text-green-500">
                      {formatPercent(
                        ((stock.signal.targetPrice - stock.signal.entryPrice) /
                          stock.signal.entryPrice) *
                          100
                      )}
                    </div>
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(
                    stock.signal.riskScore.level
                  )}`}
                >
                  {stock.signal.riskScore.level}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span
                  className={`text-sm ${
                    stock.signal.indicators.rsi > 70
                      ? 'text-red-500'
                      : stock.signal.indicators.rsi < 30
                      ? 'text-green-500'
                      : 'text-gray-300'
                  }`}
                >
                  {stock.signal.indicators.rsi.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                {stock.signal.riskReward ? `1:${stock.signal.riskReward.toFixed(2)}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
