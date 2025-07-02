import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getUserById } from '@/lib/services/auth-service';

/**
 * Bild-Upload API
 * POST /api/admin/upload - Bild hochladen
 * GET /api/admin/upload - Verfügbare Bilder auflisten
 */

// Verfügbare Bilder auflisten
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

    // Alle Bilder aus dem public/uploads Ordner lesen
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    let availableImages: string[] = [];
    
    try {
      const files = await readdir(uploadDir);
      availableImages = files.filter(file => {
        const ext = file.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
      }); // Nur Dateinamen, ohne Pfad
    } catch (error) {
      console.error('Fehler beim Lesen des Upload-Ordners:', error);
      // Fallback: Standard-Bilder
      availableImages = [
        'room-bedroom.png',
        'city1-background.png',
        'building1-server-farm.png',
        'placeholder.jpg',
        'placeholder.svg'
      ];
    }

    return NextResponse.json({
      success: true,
      images: availableImages
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Bilder:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

// Bild hochladen
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }

    // Dateityp validieren
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nur Bilddateien sind erlaubt (JPEG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    // Dateigröße validieren (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Datei ist zu groß (max 5MB)' },
        { status: 400 }
      );
    }

    // Ursprünglichen Dateinamen beibehalten, aber Duplikate vermeiden
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop();
    const baseName = originalName.replace(`.${fileExtension}`, '');
    
    // Prüfen ob Datei bereits existiert
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    let fileName = originalName;
    let counter = 1;
    
    try {
      const existingFiles = await readdir(uploadDir);
      while (existingFiles.includes(fileName)) {
        fileName = `${baseName}_${counter}.${fileExtension}`;
        counter++;
      }
    } catch (error) {
      console.error('Fehler beim Prüfen existierender Dateien:', error);
    }

    // Upload-Ordner erstellen falls nicht vorhanden
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Fehler beim Erstellen des Upload-Ordners:', error);
    }

    // Datei speichern
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const imageUrl = fileName; // Nur Dateiname, ohne Pfad

    return NextResponse.json({
      success: true,
      imageUrl,
      fileName,
      displayName: fileName, // Für Dropdown-Anzeige
      message: 'Bild erfolgreich hochgeladen'
    });

  } catch (error) {
    console.error('Fehler beim Hochladen des Bildes:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
} 