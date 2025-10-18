import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { checkRateLimit } from '@/lib/cache/simple-cache';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const allowed = await checkRateLimit(ip, 100, 60000);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const signalType = searchParams.get('signal') as 'BUY' | 'SELL' | null;
    const riskLevel = searchParams.get('risk') as
      | 'LOW'
      | 'MEDIUM'
      | 'HIGH'
      | 'EXTREME'
      | null;
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { db } = await connectToDatabase();

    // Build query
    const query: any = {
      timestamp: { $gte: new Date(Date.now() - 86400000) }, // Last 24 hours
    };

    if (signalType) {
      query['signal.type'] = signalType;
    }

    if (riskLevel) {
      query['signal.riskScore.level'] = riskLevel;
    }

    if (minConfidence > 0) {
      query['signal.confidence'] = { $gte: minConfidence };
    }

    // Fetch signals
    const signals = await db
      .collection('signals')
      .find(query)
      .sort({ 'signal.confidence': -1 })
      .limit(limit)
      .toArray();

    // Return empty data if no signals
    if (signals.length === 0) {
      return NextResponse.json({
        total: 0,
        signals: [],
        byRisk: { low: 0, medium: 0, high: 0, extreme: 0 },
        bySignal: { buy: 0, sell: 0 },
        groups: {
          lowRisk: [],
          mediumRisk: [],
          highRisk: [],
          extremeRisk: [],
          buySignals: [],
          sellSignals: [],
        },
      });
    }

    // Group by risk level
    const lowRisk = signals.filter((s) => s.signal?.riskScore?.level === 'LOW');
    const mediumRisk = signals.filter((s) => s.signal?.riskScore?.level === 'MEDIUM');
    const highRisk = signals.filter((s) => s.signal?.riskScore?.level === 'HIGH');
    const extremeRisk = signals.filter((s) => s.signal?.riskScore?.level === 'EXTREME');

    // Group by signal type
    const buySignals = signals.filter((s) => s.signal?.type === 'BUY');
    const sellSignals = signals.filter((s) => s.signal?.type === 'SELL');

    return NextResponse.json({
      total: signals.length,
      signals,
      byRisk: {
        low: lowRisk.length,
        medium: mediumRisk.length,
        high: highRisk.length,
        extreme: extremeRisk.length,
      },
      bySignal: {
        buy: buySignals.length,
        sell: sellSignals.length,
      },
      groups: {
        lowRisk,
        mediumRisk,
        highRisk,
        extremeRisk,
        buySignals,
        sellSignals,
      },
    });
  } catch (error: any) {
    console.error('Screener error:', error);
    // Return empty data on error
    return NextResponse.json({
      total: 0,
      signals: [],
      byRisk: { low: 0, medium: 0, high: 0, extreme: 0 },
      bySignal: { buy: 0, sell: 0 },
      groups: {
        lowRisk: [],
        mediumRisk: [],
        highRisk: [],
        extremeRisk: [],
        buySignals: [],
        sellSignals: [],
      },
    });
  }
}
