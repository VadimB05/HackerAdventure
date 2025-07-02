import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * API-Route für das Servieren von Upload-Dateien
 * GET /api/uploads/[filename]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Pfad zur Datei konstruieren
    const filename = params.path.join('/');
    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    // Prüfen ob die Datei existiert
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Datei nicht gefunden' },
        { status: 404 }
      );
    }

    // Datei lesen
    const fileBuffer = await readFile(filePath);

    // MIME-Type basierend auf Dateiendung bestimmen
    const getMimeType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'png':
          return 'image/png';
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'gif':
          return 'image/gif';
        case 'svg':
          return 'image/svg+xml';
        case 'webp':
          return 'image/webp';
        case 'ico':
          return 'image/x-icon';
        case 'pdf':
          return 'application/pdf';
        case 'txt':
          return 'text/plain';
        case 'json':
          return 'application/json';
        default:
          return 'application/octet-stream';
      }
    };

    const mimeType = getMimeType(filename);

    // Response mit korrekten Headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000', // 1 Jahr Cache
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Fehler beim Servieren der Upload-Datei:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS für CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 