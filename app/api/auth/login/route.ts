import { NextRequest, NextResponse } from 'next/server';
import { validateLogin } from '@/lib/validation';
import { loginUser } from '@/lib/services/auth-service';

/**
 * Benutzer anmelden
 * POST /api/auth/login
 * Body: { username: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Eingabedaten validieren
    const validation = validateLogin(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validierungsfehler',
        details: validation.errors
      }, { status: 400 });
    }

    const { username, password } = validation.data;

    // Benutzer anmelden
    const result = await loginUser(username, password);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 401 });
    }

    // Erfolgreiche Anmeldung
    const response = NextResponse.json({
      success: true,
      message: 'Anmeldung erfolgreich',
      user: {
        id: result.user!.id,
        username: result.user!.username,
        email: result.user!.email,
        isAdmin: result.user!.isAdmin
      }
    }, { status: 200 });

    // JWT-Token als HTTP-Only Cookie setzen
    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    });

    return response;

  } catch (error) {
    console.error('Anmeldefehler:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Serverfehler bei der Anmeldung'
    }, { status: 500 });
  }
} 