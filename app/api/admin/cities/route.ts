import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Städte-Verwaltung API
 * GET /api/admin/cities - Alle Städte abrufen
 * POST /api/admin/cities - Neue Stadt erstellen
 */

// Alle Städte abrufen
export async function GET(request: NextRequest) {
  try {
    // User-Info aus Headers extrahieren (von Middleware gesetzt)
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 });
    }

    // Admin-Status aus der Datenbank prüfen
    const dbUser = await getUserById(user.id);
    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Admin-Berechtigung erforderlich' }, { status: 403 });
    }

    const cities = await executeQuery<{
      id: number;
      city_id: string;
      name: string;
      description: string | null;
      is_available: boolean;
      required_level: number;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT id, city_id, name, description, is_available, required_level, created_at, updated_at FROM cities ORDER BY required_level, name'
    );

    return NextResponse.json({
      success: true,
      cities
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Städte:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Neue Stadt erstellen
export async function POST(request: NextRequest) {
  try {
    // User-Info aus Headers extrahieren (von Middleware gesetzt)
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 });
    }

    // Admin-Status aus der Datenbank prüfen
    const dbUser = await getUserById(user.id);
    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Admin-Berechtigung erforderlich' }, { status: 403 });
    }

    const body = await request.json();
    const { city_id, name, description, is_available, required_level } = body;

    // Validierung
    if (!city_id || !name) {
      return NextResponse.json(
        { error: 'city_id und name sind erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob city_id bereits existiert
    const existingCity = await executeQuerySingle<{id: number}>(
      'SELECT id FROM cities WHERE city_id = ?',
      [city_id]
    );

    if (existingCity) {
      return NextResponse.json(
        { error: 'Eine Stadt mit dieser city_id existiert bereits' },
        { status: 409 }
      );
    }

    // Neue Stadt erstellen
    const result = await executeUpdate(
      'INSERT INTO cities (city_id, name, description, is_available, required_level) VALUES (?, ?, ?, ?, ?)',
      [
        city_id,
        name,
        description || null,
        is_available !== undefined ? is_available : true,
        required_level || 1
      ]
    );

    // Erstellte Stadt abrufen
    const newCity = await executeQuerySingle<{
      id: number;
      city_id: string;
      name: string;
      description: string | null;
      is_available: boolean;
      required_level: number;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT id, city_id, name, description, is_available, required_level, created_at, updated_at FROM cities WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      city: newCity,
      message: 'Stadt erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Stadt:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 