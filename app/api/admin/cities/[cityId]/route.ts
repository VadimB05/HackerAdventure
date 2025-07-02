import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle, executeUpdate } from '@/lib/database';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Einzelne Stadt-Verwaltung API
 * GET /api/admin/cities/[cityId] - Stadt abrufen
 * PUT /api/admin/cities/[cityId] - Stadt aktualisieren
 * DELETE /api/admin/cities/[cityId] - Stadt löschen
 */

// Stadt abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
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

    const { cityId } = await params;

    const city = await executeQuerySingle<{
      id: number;
      city_id: string;
      name: string;
      description: string | null;
      is_available: boolean;
      required_level: number;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT id, city_id, name, description, is_available, required_level, created_at, updated_at FROM cities WHERE city_id = ?',
      [cityId]
    );

    if (!city) {
      return NextResponse.json(
        { error: 'Stadt nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      city
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Stadt:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Stadt aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
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

    const { cityId } = await params;
    const body = await request.json();
    const { city_id, name, description, is_available, required_level } = body;

    // Validierung
    if (!city_id || !name) {
      return NextResponse.json(
        { error: 'city_id und name sind erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob Stadt existiert
    const existingCity = await executeQuerySingle<{id: number}>(
      'SELECT id FROM cities WHERE city_id = ?',
      [cityId]
    );

    if (!existingCity) {
      return NextResponse.json(
        { error: 'Stadt nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob neue city_id bereits existiert (außer bei der aktuellen Stadt)
    if (city_id !== cityId) {
      const duplicateCity = await executeQuerySingle<{id: number}>(
        'SELECT id FROM cities WHERE city_id = ? AND city_id != ?',
        [city_id, cityId]
      );

      if (duplicateCity) {
        return NextResponse.json(
          { error: 'Eine Stadt mit dieser city_id existiert bereits' },
          { status: 409 }
        );
      }
    }

    // Stadt aktualisieren
    await executeUpdate(
      'UPDATE cities SET city_id = ?, name = ?, description = ?, is_available = ?, required_level = ? WHERE city_id = ?',
      [
        city_id,
        name,
        description || null,
        is_available !== undefined ? is_available : true,
        required_level || 1,
        cityId
      ]
    );

    // Aktualisierte Stadt abrufen
    const updatedCity = await executeQuerySingle<{
      id: number;
      city_id: string;
      name: string;
      description: string | null;
      is_available: boolean;
      required_level: number;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT id, city_id, name, description, is_available, required_level, created_at, updated_at FROM cities WHERE city_id = ?',
      [city_id]
    );

    return NextResponse.json({
      success: true,
      city: updatedCity,
      message: 'Stadt erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Stadt:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Stadt löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
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

    const { cityId } = await params;

    // Prüfen ob Stadt existiert
    const existingCity = await executeQuerySingle<{id: number}>(
      'SELECT id FROM cities WHERE city_id = ?',
      [cityId]
    );

    if (!existingCity) {
      return NextResponse.json(
        { error: 'Stadt nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob Stadt Missionen hat
    const cityMissions = await executeQuery<{id: number}>(
      'SELECT id FROM city_missions WHERE city_id = ?',
      [cityId]
    );

    if (cityMissions.length > 0) {
      return NextResponse.json(
        { error: 'Stadt kann nicht gelöscht werden, da sie noch Missionen zugeordnet hat' },
        { status: 409 }
      );
    }

    // Prüfen ob Stadt Räume hat
    const cityRooms = await executeQuery<{id: number}>(
      'SELECT id FROM rooms WHERE city_id = ?',
      [cityId]
    );

    if (cityRooms.length > 0) {
      return NextResponse.json(
        { error: 'Stadt kann nicht gelöscht werden, da sie noch Räume zugeordnet hat' },
        { status: 409 }
      );
    }

    // Stadt löschen
    const result = await executeUpdate(
      'DELETE FROM cities WHERE city_id = ?',
      [cityId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Stadt konnte nicht gelöscht werden' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stadt erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Fehler beim Löschen der Stadt:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 