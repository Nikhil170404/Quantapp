import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Test MongoDB connection
    const result = await db.admin().ping();

    // Count signals
    const count = await db.collection('signals').countDocuments();

    return NextResponse.json({
      status: 'ok',
      mongodb: 'connected',
      ping: result,
      signalsCount: count,
      message: count === 0
        ? 'MongoDB connected but no signals yet. Search for a stock to generate signals!'
        : `MongoDB connected with ${count} signals`,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
