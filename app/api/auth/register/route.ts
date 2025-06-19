import { NextRequest, NextResponse } from 'next/server';
import { validateRegister } from '@/lib/validation';
import { registerUser } from '@/lib/services/auth-service';

/**
 * Benutzer registrieren
 * POST /api/auth/register
 * Body: { username: string, password: string, email?: string, confirmPassword?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Eingabedaten validieren
    const validation = validateRegister(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validierungsfehler',
        details: validation.errors
      }, { status: 400 });
    }

    const { username, password, email } = validation.data;

    // Benutzer registrieren
    const result = await registerUser(username, password, email);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    // Erfolgreiche Registrierung
    const response = NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich registriert',
      user: {
        id: result.user!.id,
        username: result.user!.username,
        email: result.user!.email
      }
    }, { status: 201 });

    // JWT-Token als HTTP-Only Cookie setzen
    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    });

    return response;

  } catch (error) {
    console.error('Registrierungsfehler:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Serverfehler bei der Registrierung'
    }, { status: 500 });
  }
} 