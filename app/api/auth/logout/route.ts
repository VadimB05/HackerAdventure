import { NextRequest, NextResponse } from 'next/server';

/**
 * Benutzer-Abmeldung
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    // JWT-Token aus Cookie entfernen
    const response = NextResponse.json({
      success: true,
      message: 'Erfolgreich abgemeldet'
    }, { status: 200 });

    // Cookie löschen
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Logout fehlgeschlagen'
    }, { status: 500 });
  }
} 