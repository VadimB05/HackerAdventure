import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';

/**
 * JWT-Token verifizieren
 * GET /api/auth/verify
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Kein Token bereitgestellt'
      }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Ungültiger Token'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username
      },
      message: 'Token ist gültig'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Token-Verifikation fehlgeschlagen'
    }, { status: 500 });
  }
} 