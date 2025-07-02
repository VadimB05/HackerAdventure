import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

/**
 * Next.js Middleware für JWT-Authentifizierung
 * Prüft JWT-Token in Cookies und fügt User-Info zum Request hinzu
 */

export async function middleware(request: NextRequest) {
  // Pfade, die keine Authentifizierung benötigen
  const publicPaths = [
    '/',
    '/auth',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/health',
    '/api/game/health'
  ];

  const path = request.nextUrl.pathname;

  // Öffentliche Pfade überspringen
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // JWT-Token aus Cookie extrahieren
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Kein Token vorhanden - zur Auth-Seite weiterleiten
    if (path.startsWith('/game')) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    
    // API-Endpunkte ohne Token
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  try {
    // Token verifizieren
    const user = await verifyToken(token);
    
    if (!user) {
      // Ungültiger Token - Cookie löschen und zur Auth-Seite weiterleiten
      const response = NextResponse.redirect(new URL('/auth', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    // Debug: Token-User loggen
    console.log('Middleware - Token user:', user);

    // User-Info zum Request hinzufügen (Admin-Status wird in den API-Routen geprüft)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId.toString());
    requestHeaders.set('x-username', user.username);

    // Debug: Headers loggen
    console.log('Middleware - Setting headers:', {
      'x-user-id': user.userId.toString(),
      'x-username': user.username
    });

    // Request mit User-Info weiterleiten
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Middleware Auth Error:', error);
    
    // Token-Fehler - Cookie löschen und zur Auth-Seite weiterleiten
    const response = NextResponse.redirect(new URL('/auth', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

/**
 * Konfiguration für Middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 