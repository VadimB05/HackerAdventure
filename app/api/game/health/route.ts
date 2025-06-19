import { NextRequest, NextResponse } from 'next/server';

/**
 * Health-Check für Game-API
 * GET /api/game/health
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Game API ist erreichbar',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Game API Health-Check fehlgeschlagen',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 