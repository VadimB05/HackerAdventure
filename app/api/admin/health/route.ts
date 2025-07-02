import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { executeQuery } from '@/lib/database';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Health-Check für Admin-API
 * GET /api/admin/health
 */
async function handler(request: NextRequest) {
  try {
    // Debug: Alle Headers loggen
    console.log('Admin Health - Headers:', {
      'x-user-id': request.headers.get('x-user-id'),
      'x-username': request.headers.get('x-username'),
      'authorization': request.headers.get('authorization'),
      'cookie': request.headers.get('cookie')
    });

    // User-Info aus Headers extrahieren
    const user = getAuthenticatedUser(request);
    console.log('Admin Health - Extracted user:', user);
    
    if (!user) {
      console.log('Admin Health - No user found');
      return NextResponse.json({
        success: false,
        error: 'Authentifizierung erforderlich'
      }, { status: 401 });
    }

    // Admin-Status aus der Datenbank prüfen
    const dbUser = await getUserById(user.id);
    console.log('Admin Health - DB user:', dbUser);
    
    if (!dbUser || !dbUser.isAdmin) {
      console.log('Admin Health - Not admin:', { dbUser, isAdmin: dbUser?.isAdmin });
      return NextResponse.json({
        success: false,
        error: 'Admin-Berechtigung erforderlich'
      }, { status: 403 });
    }

    // Statistiken aus der Datenbank laden
    const stats = await getAdminStats();
    
    return NextResponse.json({
      success: true,
      message: 'Admin-Panel ist verfügbar',
      stats
    });
  } catch (error) {
    console.error('Admin health check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Server-Fehler'
    }, { status: 500 });
  }
}

async function getAdminStats() {
  try {
    // Alle Statistiken parallel laden
    const [
      usersResult,
      citiesResult,
      missionsResult,
      roomsResult,
      puzzlesResult,
      itemsResult
    ] = await Promise.all([
      executeQuery('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE'),
      executeQuery('SELECT COUNT(*) as count FROM cities'),
      executeQuery('SELECT COUNT(*) as count FROM missions'),
      executeQuery('SELECT COUNT(*) as count FROM rooms'),
      executeQuery('SELECT COUNT(*) as count FROM puzzles'),
      executeQuery('SELECT COUNT(*) as count FROM items')
    ]);

    return {
      totalUsers: usersResult[0].count,
      totalCities: citiesResult[0].count,
      totalMissions: missionsResult[0].count,
      totalRooms: roomsResult[0].count,
      totalPuzzles: puzzlesResult[0].count,
      totalItems: itemsResult[0].count
    };
  } catch (error) {
    console.error('Error loading admin stats:', error);
    return {
      totalUsers: 0,
      totalCities: 0,
      totalMissions: 0,
      totalRooms: 0,
      totalPuzzles: 0,
      totalItems: 0
    };
  }
}

export const GET = handler; 