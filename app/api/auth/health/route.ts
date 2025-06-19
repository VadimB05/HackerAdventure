import { NextRequest, NextResponse } from 'next/server';

/**
 * Health-Check für Auth-API
 * GET /api/auth/health
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Auth API ist erreichbar',
      timestamp: new Date().toISOString(),
      status: 'healthy'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Auth API Health-Check fehlgeschlagen',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 