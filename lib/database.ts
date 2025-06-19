import mysql from 'mysql2/promise';
import { databaseConfig } from './config';

// Verbindungspool erstellen
let connectionPool: mysql.Pool | null = null;

export async function connectDB(): Promise<mysql.Pool> {
  if (!connectionPool) {
    connectionPool = mysql.createPool(databaseConfig);
    
    // Test der Verbindung
    try {
      const connection = await connectionPool.getConnection();
      console.log('✅ Datenbankverbindung erfolgreich hergestellt');
      connection.release();
    } catch (error) {
      console.error('❌ Datenbankverbindungsfehler:', error);
      throw new Error('Datenbankverbindung fehlgeschlagen');
    }
  }
  
  return connectionPool;
}

// Hilfsfunktion zum Schließen der Verbindung
export async function closeDB(): Promise<void> {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
    console.log('🔌 Datenbankverbindung geschlossen');
  }
}

// Hilfsfunktion um undefined zu null zu konvertieren
function sanitizeParams(params: any[]): any[] {
  return params.map(param => param === undefined ? null : param);
}

// Hilfsfunktion für sichere SQL-Abfragen
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const db = await connectDB();
  const sanitizedParams = sanitizeParams(params);
  const [rows] = await db.execute(query, sanitizedParams);
  return rows as T[];
}

// Hilfsfunktion für einzelne Datensätze
export async function executeQuerySingle<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
}

// Hilfsfunktion für Insert/Update/Delete
export async function executeUpdate(
  query: string,
  params: any[] = []
): Promise<{ insertId?: number; affectedRows: number }> {
  const db = await connectDB();
  const sanitizedParams = sanitizeParams(params);
  const [result] = await db.execute(query, sanitizedParams);
  return result as any;
} 