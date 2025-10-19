import { NextRequest, NextResponse } from 'next/server';
import { PaperTradingPortfolio, PortfolioConfig } from '@/lib/paper-trading/portfolio';
import { connectToDatabase } from '@/lib/db/mongodb';

// Store portfolios in memory (use database in production)
const portfolios = new Map<string, PaperTradingPortfolio>();

/**
 * GET /api/paper-trading/portfolio - Get portfolio state
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    let portfolio = portfolios.get(userId);

    if (!portfolio) {
      // Create new portfolio
      const config: PortfolioConfig = {
        initialCash: 100000,
        commission: 0.001,
        slippage: 0.001,
        margin: false,
        marginRatio: 1,
      };
      portfolio = new PaperTradingPortfolio(config);
      portfolios.set(userId, portfolio);
    }

    const state = portfolio.getState();

    return NextResponse.json({
      success: true,
      portfolio: state,
    });
  } catch (error: any) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/paper-trading/portfolio - Place order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'default', action, symbol, shares, price, orderType } = body;

    if (!action || !symbol) {
      return NextResponse.json(
        { error: 'action and symbol are required' },
        { status: 400 }
      );
    }

    let portfolio = portfolios.get(userId);

    if (!portfolio) {
      const config: PortfolioConfig = {
        initialCash: 100000,
        commission: 0.001,
        slippage: 0.001,
        margin: false,
        marginRatio: 1,
      };
      portfolio = new PaperTradingPortfolio(config);
      portfolios.set(userId, portfolio);
    }

    let result;

    if (action === 'buy') {
      result = portfolio.placeMarketOrder(symbol, 'buy', shares, price);
    } else if (action === 'sell') {
      result = portfolio.placeMarketOrder(symbol, 'sell', shares, price);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "buy" or "sell"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result,
      portfolio: portfolio.getState(),
    });
  } catch (error: any) {
    console.error('Order placement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to place order' },
      { status: 500 }
    );
  }
}