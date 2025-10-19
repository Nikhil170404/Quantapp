/**
 * Professional Backtesting Engine
 * 
 * Features:
 * - Walk-forward analysis
 * - Realistic slippage and commissions
 * - Position sizing
 * - Multiple exit strategies
 * - Performance metrics
 */

export interface BacktestConfig {
  initialCapital: number;
  commission: number; // Per trade (e.g., 0.001 = 0.1%)
  slippage: number; // Price slippage (e.g., 0.001 = 0.1%)
  positionSizing: 'fixed' | 'kelly' | 'atr' | 'percent';
  positionSizeValue: number; // Depends on sizing method
  maxPositions: number; // Max concurrent positions
  riskPerTrade: number; // % of capital to risk per trade
}

export interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  side: 'long' | 'short';
  pnl: number;
  pnlPercent: number;
  commission: number;
  holdingPeriod: number; // days
  exitReason: 'target' | 'stop' | 'signal' | 'time';
}

export interface BacktestResult {
  trades: Trade[];
  equity: number[];
  dates: string[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    avgWinLossRatio: number;
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
    totalReturn: number;
    totalReturnPercent: number;
    cagr: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    expectancy: number;
  };
}

export interface Signal {
  date: string;
  type: 'BUY' | 'SELL' | 'EXIT';
  price: number;
  stopLoss?: number;
  target?: number;
  confidence?: number;
}

/**
 * Backtest Engine
 */
export class BacktestEngine {
  private config: BacktestConfig;
  private capital: number;
  private positions: Map<string, {
    entryDate: string;
    entryPrice: number;
    shares: number;
    stopLoss?: number;
    target?: number;
    side: 'long' | 'short';
  }>;
  private trades: Trade[];
  private equity: number[];
  private dates: string[];

  constructor(config: BacktestConfig) {
    this.config = config;
    this.capital = config.initialCapital;
    this.positions = new Map();
    this.trades = [];
    this.equity = [config.initialCapital];
    this.dates = [];
  }

  /**
   * Run backtest on historical data with signals
   */
  run(
    historicalData: Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>,
    signals: Signal[]
  ): BacktestResult {
    // Sort data and signals by date
    const sortedData = [...historicalData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const sortedSignals = [...signals].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let signalIndex = 0;

    // Iterate through each day
    for (let i = 0; i < sortedData.length; i++) {
      const candle = sortedData[i];
      this.dates.push(candle.date);

      // Check for stop loss and target hits
      this.checkExits(candle);

      // Check for signals on this day
      while (
        signalIndex < sortedSignals.length &&
        new Date(sortedSignals[signalIndex].date) <= new Date(candle.date)
      ) {
        const signal = sortedSignals[signalIndex];
        this.processSignal(signal, candle);
        signalIndex++;
      }

      // Record equity
      const positionValue = this.calculatePositionValue(candle.close);
      this.equity.push(this.capital + positionValue);
    }

    return this.generateReport();
  }

  /**
   * Process a trading signal
   */
  private processSignal(signal: Signal, candle: any): void {
    if (signal.type === 'BUY') {
      this.enterLong(signal, candle);
    } else if (signal.type === 'SELL') {
      this.enterShort(signal, candle);
    } else if (signal.type === 'EXIT') {
      this.exitAllPositions(candle, 'signal');
    }
  }

  /**
   * Enter long position
   */
  private enterLong(signal: Signal, candle: any): void {
    // Check if we can open new position
    if (this.positions.size >= this.config.maxPositions) {
      return;
    }

    // Calculate position size
    const shares = this.calculatePositionSize(
      signal.price,
      signal.stopLoss
    );

    if (shares === 0) return;

    // Apply slippage
    const entryPrice = signal.price * (1 + this.config.slippage);
    const positionCost = shares * entryPrice;
    const commission = positionCost * this.config.commission;

    // Check if we have enough capital
    if (positionCost + commission > this.capital) {
      return;
    }

    // Deduct from capital
    this.capital -= (positionCost + commission);

    // Add position
    this.positions.set(candle.date, {
      entryDate: candle.date,
      entryPrice,
      shares,
      stopLoss: signal.stopLoss,
      target: signal.target,
      side: 'long',
    });
  }

  /**
   * Enter short position (similar to long)
   */
  private enterShort(signal: Signal, candle: any): void {
    if (this.positions.size >= this.config.maxPositions) return;

    const shares = this.calculatePositionSize(signal.price, signal.stopLoss);
    if (shares === 0) return;

    const entryPrice = signal.price * (1 - this.config.slippage);
    const positionCost = shares * entryPrice;
    const commission = positionCost * this.config.commission;

    if (positionCost + commission > this.capital) return;

    this.capital += (positionCost - commission);

    this.positions.set(candle.date, {
      entryDate: candle.date,
      entryPrice,
      shares,
      stopLoss: signal.stopLoss,
      target: signal.target,
      side: 'short',
    });
  }

  /**
   * Check for stop loss and target hits
   */
  private checkExits(candle: any): void {
    const positionsToClose: string[] = [];

    this.positions.forEach((position, key) => {
      if (position.side === 'long') {
        // Check stop loss
        if (position.stopLoss && candle.low <= position.stopLoss) {
          this.closePosition(key, position.stopLoss, candle.date, 'stop');
          positionsToClose.push(key);
        }
        // Check target
        else if (position.target && candle.high >= position.target) {
          this.closePosition(key, position.target, candle.date, 'target');
          positionsToClose.push(key);
        }
      } else {
        // Short position
        if (position.stopLoss && candle.high >= position.stopLoss) {
          this.closePosition(key, position.stopLoss, candle.date, 'stop');
          positionsToClose.push(key);
        } else if (position.target && candle.low <= position.target) {
          this.closePosition(key, position.target, candle.date, 'target');
          positionsToClose.push(key);
        }
      }
    });

    // Remove closed positions
    positionsToClose.forEach(key => this.positions.delete(key));
  }

  /**
   * Close a position
   */
  private closePosition(
    key: string,
    exitPrice: number,
    exitDate: string,
    exitReason: Trade['exitReason']
  ): void {
    const position = this.positions.get(key);
    if (!position) return;

    // Apply slippage
    const actualExitPrice = position.side === 'long'
      ? exitPrice * (1 - this.config.slippage)
      : exitPrice * (1 + this.config.slippage);

    const proceeds = position.shares * actualExitPrice;
    const commission = proceeds * this.config.commission;

    // Calculate P&L
    let pnl: number;
    if (position.side === 'long') {
      const cost = position.shares * position.entryPrice;
      pnl = proceeds - cost - commission * 2; // Entry + exit commission
      this.capital += proceeds - commission;
    } else {
      const cost = position.shares * position.entryPrice;
      pnl = cost - proceeds - commission * 2;
      this.capital -= proceeds + commission;
    }

    const pnlPercent = (pnl / (position.shares * position.entryPrice)) * 100;
    const holdingPeriod = this.calculateDaysDiff(position.entryDate, exitDate);

    // Record trade
    this.trades.push({
      entryDate: position.entryDate,
      entryPrice: position.entryPrice,
      exitDate,
      exitPrice: actualExitPrice,
      shares: position.shares,
      side: position.side,
      pnl,
      pnlPercent,
      commission: commission * 2,
      holdingPeriod,
      exitReason,
    });
  }

  /**
   * Exit all open positions
   */
  private exitAllPositions(candle: any, exitReason: Trade['exitReason']): void {
    const keys = Array.from(this.positions.keys());
    keys.forEach(key => {
      this.closePosition(key, candle.close, candle.date, exitReason);
    });
    this.positions.clear();
  }

  /**
   * Calculate position size based on strategy
   */
  private calculatePositionSize(price: number, stopLoss?: number): number {
    switch (this.config.positionSizing) {
      case 'fixed':
        return Math.floor(this.config.positionSizeValue / price);
      
      case 'percent':
        const amount = this.capital * (this.config.positionSizeValue / 100);
        return Math.floor(amount / price);
      
      case 'atr':
        if (!stopLoss) return 0;
        const riskAmount = this.capital * (this.config.riskPerTrade / 100);
        const stopDistance = Math.abs(price - stopLoss);
        return Math.floor(riskAmount / stopDistance);
      
      case 'kelly':
        // Simplified Kelly - needs win rate and avg win/loss from past trades
        const winRate = this.calculateWinRate();
        const avgWinLoss = this.calculateAvgWinLoss();
        if (avgWinLoss === 0) return 0;
        const kelly = (winRate / avgWinLoss) - ((1 - winRate) / 1);
        const kellyPercent = Math.max(0, Math.min(kelly * 100, 25)); // Cap at 25%
        const kellyAmount = this.capital * (kellyPercent / 100);
        return Math.floor(kellyAmount / price);
      
      default:
        return 0;
    }
  }

  /**
   * Calculate current position value
   */
  private calculatePositionValue(currentPrice: number): number {
    let total = 0;
    this.positions.forEach(position => {
      if (position.side === 'long') {
        total += position.shares * currentPrice;
      } else {
        total += position.shares * (2 * position.entryPrice - currentPrice);
      }
    });
    return total;
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysDiff(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate win rate from completed trades
   */
  private calculateWinRate(): number {
    if (this.trades.length === 0) return 0.5;
    const wins = this.trades.filter(t => t.pnl > 0).length;
    return wins / this.trades.length;
  }

  /**
   * Calculate average win/loss ratio
   */
  private calculateAvgWinLoss(): number {
    const wins = this.trades.filter(t => t.pnl > 0);
    const losses = this.trades.filter(t => t.pnl < 0);
    
    if (wins.length === 0 || losses.length === 0) return 0;
    
    const avgWin = wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length;
    const avgLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length);
    
    return avgLoss === 0 ? 0 : avgWin / avgLoss;
  }

  /**
   * Generate comprehensive backtest report
   */
  private generateReport(): BacktestResult {
    const wins = this.trades.filter(t => t.pnl > 0);
    const losses = this.trades.filter(t => t.pnl < 0);
    
    const totalGain = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    
    const finalEquity = this.equity[this.equity.length - 1];
    const totalReturn = finalEquity - this.config.initialCapital;
    const totalReturnPercent = (totalReturn / this.config.initialCapital) * 100;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = this.equity[0];
    for (const equity of this.equity) {
      if (equity > peak) peak = equity;
      const drawdown = peak - equity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    const maxDrawdownPercent = (maxDrawdown / peak) * 100;

    // Calculate returns for Sharpe/Sortino
    const returns: number[] = [];
    for (let i = 1; i < this.equity.length; i++) {
      returns.push((this.equity[i] - this.equity[i - 1]) / this.equity[i - 1]);
    }

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252); // Annualized

    // Sortino (downside deviation)
    const downsideReturns = returns.filter(r => r < 0);
    const downsideStdDev = downsideReturns.length === 0 ? 0 : Math.sqrt(
      downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length
    );
    const sortinoRatio = downsideStdDev === 0 ? 0 : (avgReturn / downsideStdDev) * Math.sqrt(252);

    // CAGR
    const years = this.dates.length / 252; // Approximate trading days per year
    const cagr = years === 0 ? 0 : (Math.pow(finalEquity / this.config.initialCapital, 1 / years) - 1) * 100;

    // Calmar Ratio
    const calmarRatio = maxDrawdownPercent === 0 ? 0 : cagr / maxDrawdownPercent;

    // Consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentStreak = 0;
    let currentType: 'win' | 'loss' | null = null;

    this.trades.forEach(trade => {
      const isWin = trade.pnl > 0;
      if (currentType === null || (isWin && currentType === 'win') || (!isWin && currentType === 'loss')) {
        currentStreak++;
        currentType = isWin ? 'win' : 'loss';
      } else {
        if (currentType === 'win') {
          maxConsecutiveWins = Math.max(maxConsecutiveWins, currentStreak);
        } else {
          maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak);
        }
        currentStreak = 1;
        currentType = isWin ? 'win' : 'loss';
      }
    });

    // Handle last streak
    if (currentType === 'win') {
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentStreak);
    } else if (currentType === 'loss') {
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak);
    }

    return {
      trades: this.trades,
      equity: this.equity,
      dates: this.dates,
      metrics: {
        totalTrades: this.trades.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
        winRate: this.trades.length === 0 ? 0 : (wins.length / this.trades.length) * 100,
        profitFactor: totalLoss === 0 ? 0 : totalGain / totalLoss,
        avgWin: wins.length === 0 ? 0 : totalGain / wins.length,
        avgLoss: losses.length === 0 ? 0 : totalLoss / losses.length,
        avgWinLossRatio: this.calculateAvgWinLoss(),
        maxConsecutiveWins,
        maxConsecutiveLosses,
        totalReturn,
        totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
        cagr: Number(cagr.toFixed(2)),
        maxDrawdown,
        maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
        sharpeRatio: Number(sharpeRatio.toFixed(2)),
        sortinoRatio: Number(sortinoRatio.toFixed(2)),
        calmarRatio: Number(calmarRatio.toFixed(2)),
        expectancy: this.trades.length === 0 ? 0 : totalReturn / this.trades.length,
      },
    };
  }
}