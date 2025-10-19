/**
 * Paper Trading Portfolio Management System
 * 
 * Features:
 * - Virtual cash and position management
 * - Market, limit, and stop-loss orders
 * - Real-time P&L tracking
 * - Commission and slippage simulation
 * - Trade history and analytics
 */

export interface PortfolioConfig {
  initialCash: number;
  commission: number; // Per trade (e.g., 0.001 = 0.1%)
  slippage: number; // Price slippage (e.g., 0.001 = 0.1%)
  margin: boolean; // Allow margin trading
  marginRatio: number; // Margin multiplier (e.g., 2 = 2x leverage)
}

export interface Position {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  side: 'long' | 'short';
  openDate: Date;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  shares: number;
  price?: number; // For limit/stop orders
  status: 'pending' | 'filled' | 'cancelled';
  filledPrice?: number;
  filledShares?: number;
  commission?: number;
  timestamp: Date;
  filledTimestamp?: Date;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  shares: number;
  price: number;
  commission: number;
  total: number;
  timestamp: Date;
}

export interface PortfolioState {
  cash: number;
  equity: number; // Cash + Position Value
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

export class PaperTradingPortfolio {
  private config: PortfolioConfig;
  private cash: number;
  private positions: Map<string, Position>;
  private openOrders: Order[];
  private tradeHistory: Trade[];
  private initialCash: number;
  private dayStartEquity: number;

  constructor(config: PortfolioConfig) {
    this.config = config;
    this.cash = config.initialCash;
    this.initialCash = config.initialCash;
    this.positions = new Map();
    this.openOrders = [];
    this.tradeHistory = [];
    this.dayStartEquity = config.initialCash;
  }

  /**
   * Get current portfolio state
   */
  getState(): PortfolioState {
    const positions = Array.from(this.positions.values());
    const equity = this.calculateEquity();
    const performance = this.calculatePerformance();

    return {
      cash: Number(this.cash.toFixed(2)),
      equity: Number(equity.toFixed(2)),
      positions,
      openOrders: this.openOrders,
      tradeHistory: this.tradeHistory,
      performance,
    };
  }

  /**
   * Place a market order
   */
  placeMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    shares: number,
    currentPrice: number
  ): Order {
    const orderId = this.generateOrderId();

    // Apply slippage
    const slippageMultiplier = side === 'buy' ? 1 + this.config.slippage : 1 - this.config.slippage;
    const filledPrice = currentPrice * slippageMultiplier;

    // Calculate costs
    const total = shares * filledPrice;
    const commission = total * this.config.commission;

    // Validate order
    if (side === 'buy') {
      const requiredCash = total + commission;
      if (requiredCash > this.cash) {
        throw new Error(`Insufficient cash. Required: ₹${requiredCash.toFixed(2)}, Available: ₹${this.cash.toFixed(2)}`);
      }
    } else {
      const position = this.positions.get(symbol);
      if (!position || position.shares < shares) {
        throw new Error(`Insufficient shares. Trying to sell ${shares}, but only have ${position?.shares || 0}`);
      }
    }

    // Execute order
    const order: Order = {
      id: orderId,
      symbol,
      side,
      type: 'market',
      shares,
      status: 'filled',
      filledPrice,
      filledShares: shares,
      commission,
      timestamp: new Date(),
      filledTimestamp: new Date(),
    };

    // Update portfolio
    this.executeOrder(order);

    return order;
  }

  /**
   * Place a limit order
   */
  placeLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    shares: number,
    limitPrice: number
  ): Order {
    const orderId = this.generateOrderId();

    const order: Order = {
      id: orderId,
      symbol,
      side,
      type: 'limit',
      shares,
      price: limitPrice,
      status: 'pending',
      timestamp: new Date(),
    };

    this.openOrders.push(order);
    return order;
  }

  /**
   * Place a stop-loss order
   */
  placeStopOrder(
    symbol: string,
    side: 'buy' | 'sell',
    shares: number,
    stopPrice: number
  ): Order {
    const orderId = this.generateOrderId();

    const order: Order = {
      id: orderId,
      symbol,
      side,
      type: 'stop',
      shares,
      price: stopPrice,
      status: 'pending',
      timestamp: new Date(),
    };

    this.openOrders.push(order);
    return order;
  }

  /**
   * Cancel an open order
   */
  cancelOrder(orderId: string): boolean {
    const index = this.openOrders.findIndex(order => order.id === orderId);
    if (index === -1) return false;

    this.openOrders[index].status = 'cancelled';
    this.openOrders.splice(index, 1);
    return true;
  }

  /**
   * Update positions with current prices
   */
  updatePositions(prices: Record<string, number>): void {
    this.positions.forEach((position, symbol) => {
      if (prices[symbol] !== undefined) {
        position.currentPrice = prices[symbol];
        position.marketValue = position.shares * position.currentPrice;
        position.unrealizedPnL = position.marketValue - position.costBasis;
        position.unrealizedPnLPercent = (position.unrealizedPnL / position.costBasis) * 100;
      }
    });

    // Check if any limit/stop orders should be filled
    this.checkPendingOrders(prices);
  }

  /**
   * Close a position
   */
  closePosition(symbol: string, currentPrice: number): Order | null {
    const position = this.positions.get(symbol);
    if (!position) return null;

    return this.placeMarketOrder(symbol, 'sell', position.shares, currentPrice);
  }

  /**
   * Execute an order (internal)
   */
  private executeOrder(order: Order): void {
    if (!order.filledPrice || !order.filledShares) return;

    const { symbol, side, filledShares, filledPrice, commission } = order;
    const total = filledShares * filledPrice;

    if (side === 'buy') {
      // Deduct cash
      this.cash -= (total + (commission || 0));

      // Update or create position
      const existingPosition = this.positions.get(symbol);
      if (existingPosition) {
        // Average down/up
        const totalShares = existingPosition.shares + filledShares;
        const totalCost = existingPosition.costBasis + total;
        existingPosition.shares = totalShares;
        existingPosition.avgPrice = totalCost / totalShares;
        existingPosition.costBasis = totalCost;
        existingPosition.currentPrice = filledPrice;
        existingPosition.marketValue = totalShares * filledPrice;
        existingPosition.unrealizedPnL = existingPosition.marketValue - existingPosition.costBasis;
        existingPosition.unrealizedPnLPercent = (existingPosition.unrealizedPnL / existingPosition.costBasis) * 100;
      } else {
        // New position
        this.positions.set(symbol, {
          symbol,
          shares: filledShares,
          avgPrice: filledPrice,
          currentPrice: filledPrice,
          marketValue: total,
          costBasis: total,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          side: 'long',
          openDate: new Date(),
        });
      }
    } else {
      // Sell
      const position = this.positions.get(symbol);
      if (!position) return;

      // Add cash
      this.cash += (total - (commission || 0));

      // Update position
      position.shares -= filledShares;
      position.costBasis = position.shares * position.avgPrice;
      position.marketValue = position.shares * filledPrice;
      position.unrealizedPnL = position.marketValue - position.costBasis;
      position.unrealizedPnLPercent = position.costBasis === 0 ? 0 : (position.unrealizedPnL / position.costBasis) * 100;

      // Remove position if fully closed
      if (position.shares === 0) {
        this.positions.delete(symbol);
      }
    }

    // Record trade
    this.tradeHistory.push({
      id: order.id,
      symbol,
      side,
      shares: filledShares,
      price: filledPrice,
      commission: commission || 0,
      total,
      timestamp: new Date(),
    });
  }

  /**
   * Check and fill pending orders
   */
  private checkPendingOrders(prices: Record<string, number>): void {
    const ordersToFill: Order[] = [];

    this.openOrders.forEach(order => {
      const currentPrice = prices[order.symbol];
      if (!currentPrice || !order.price) return;

      let shouldFill = false;

      if (order.type === 'limit') {
        if (order.side === 'buy' && currentPrice <= order.price) {
          shouldFill = true;
        } else if (order.side === 'sell' && currentPrice >= order.price) {
          shouldFill = true;
        }
      } else if (order.type === 'stop') {
        if (order.side === 'buy' && currentPrice >= order.price) {
          shouldFill = true;
        } else if (order.side === 'sell' && currentPrice <= order.price) {
          shouldFill = true;
        }
      }

      if (shouldFill) {
        // Fill the order
        order.status = 'filled';
        order.filledPrice = currentPrice;
        order.filledShares = order.shares;
        order.commission = (order.shares * currentPrice) * this.config.commission;
        order.filledTimestamp = new Date();

        ordersToFill.push(order);
      }
    });

    // Execute filled orders
    ordersToFill.forEach(order => {
      this.executeOrder(order);
      // Remove from open orders
      const index = this.openOrders.findIndex(o => o.id === order.id);
      if (index !== -1) {
        this.openOrders.splice(index, 1);
      }
    });
  }

  /**
   * Calculate total equity
   */
  private calculateEquity(): number {
    let positionValue = 0;
    this.positions.forEach(position => {
      positionValue += position.marketValue;
    });
    return this.cash + positionValue;
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance(): PortfolioState['performance'] {
    const equity = this.calculateEquity();
    const totalReturn = equity - this.initialCash;
    const totalReturnPercent = (totalReturn / this.initialCash) * 100;

    const dayReturn = equity - this.dayStartEquity;
    const dayReturnPercent = (dayReturn / this.dayStartEquity) * 100;

    const totalCommissions = this.tradeHistory.reduce((sum, trade) => sum + trade.commission, 0);
    const totalTrades = this.tradeHistory.length;

    // Calculate win rate (closed trades only)
    const closedTrades = this.calculateClosedTrades();
    const winningTrades = closedTrades.filter(trade => trade.pnl > 0);
    const losingTrades = closedTrades.filter(trade => trade.pnl < 0);
    const winRate = closedTrades.length === 0 ? 0 : (winningTrades.length / closedTrades.length) * 100;

    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
    const profitFactor = grossLoss === 0 ? 0 : grossProfit / grossLoss;

    return {
      totalReturn: Number(totalReturn.toFixed(2)),
      totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
      dayReturn: Number(dayReturn.toFixed(2)),
      dayReturnPercent: Number(dayReturnPercent.toFixed(2)),
      totalCommissions: Number(totalCommissions.toFixed(2)),
      totalTrades,
      winRate: Number(winRate.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
    };
  }

  /**
   * Calculate closed trades P&L
   */
  private calculateClosedTrades(): Array<{ symbol: string; pnl: number }> {
    const trades: Array<{ symbol: string; pnl: number }> = [];
    const symbolTrades = new Map<string, Trade[]>();

    // Group trades by symbol
    this.tradeHistory.forEach(trade => {
      if (!symbolTrades.has(trade.symbol)) {
        symbolTrades.set(trade.symbol, []);
      }
      symbolTrades.get(trade.symbol)!.push(trade);
    });

    // Calculate P&L for each closed position
    symbolTrades.forEach((symbolTradeList, symbol) => {
      let buyShares = 0;
      let buyTotal = 0;
      let sellShares = 0;
      let sellTotal = 0;

      symbolTradeList.forEach(trade => {
        if (trade.side === 'buy') {
          buyShares += trade.shares;
          buyTotal += trade.total + trade.commission;
        } else {
          sellShares += trade.shares;
          sellTotal += trade.total - trade.commission;
        }
      });

      // If position is closed (buy shares = sell shares)
      if (buyShares === sellShares && buyShares > 0) {
        const pnl = sellTotal - buyTotal;
        trades.push({ symbol, pnl });
      }
    });

    return trades;
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset portfolio (for testing)
   */
  reset(): void {
    this.cash = this.initialCash;
    this.positions.clear();
    this.openOrders = [];
    this.tradeHistory = [];
    this.dayStartEquity = this.initialCash;
  }

  /**
   * Get position by symbol
   */
  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  /**
   * Get all positions
   */
  getAllPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get trade history
   */
  getTradeHistory(): Trade[] {
    return this.tradeHistory;
  }

  /**
   * Set day start equity (for daily P&L calculation)
   */
  setDayStartEquity(): void {
    this.dayStartEquity = this.calculateEquity();
  }
}