import { NextRequest, NextResponse } from 'next/server';

/**
 * Health-Check für Admin-API
 * GET /api/admin/health
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Admin API ist erreichbar',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0',
      features: ['rooms', 'puzzles', 'items', 'users']
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Admin API Health-Check fehlgeschlagen',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 