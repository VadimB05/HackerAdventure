import { NextRequest, NextResponse } from 'next/server';

/**
 * Benutzer-Abmeldung
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Erfolgreich abgemeldet'
    }, { status: 200 });

    // JWT-Token Cookie löschen
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Sofort ablaufen
      expires: new Date(0) // Sofort ablaufen
    });
    
    return response;
  } catch (error) {
    console.error('Logout-Fehler:', error);
    return NextResponse.json({
      success: false,
      error: 'Logout fehlgeschlagen'
    }, { status: 500 });
  }
} 