/**
 * Zentrale Konfigurationsdatei für INTRUSION
 * Lädt und validiert alle Umgebungsvariablen
 */

// ========================================
// DATENBANK-KONFIGURATION
// ========================================
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'intrusion_game',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
} as const;

// ========================================
// JWT-KONFIGURATION
// ========================================
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  expiresIn: '24h',
  algorithm: 'HS256' as const,
} as const;

// ========================================
// ANWENDUNGS-KONFIGURATION
// ========================================
export const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG === 'true',
  allowedOrigins: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
} as const;

// ========================================
// VALIDIERUNG
// ========================================
function validateConfig() {
  const errors: string[] = [];

  // Datenbank-Validierung
  if (!databaseConfig.host) {
    errors.push('DB_HOST ist erforderlich');
  }
  if (!databaseConfig.user) {
    errors.push('DB_USER ist erforderlich');
  }
  if (!databaseConfig.database) {
    errors.push('DB_NAME ist erforderlich');
  }

  // JWT-Validierung
  if (jwtConfig.secret === 'fallback-secret-change-in-production') {
    console.warn('⚠️  JWT_SECRET verwendet Fallback-Wert. Ändere dies in Produktion!');
  }
  if (jwtConfig.secret.length < 32) {
    console.warn('⚠️  JWT_SECRET sollte mindestens 32 Zeichen lang sein');
  }

  // Umgebungsvalidierung
  if (appConfig.nodeEnv === 'production' && jwtConfig.secret === 'fallback-secret-change-in-production') {
    errors.push('JWT_SECRET muss in Produktion gesetzt werden');
  }

  if (errors.length > 0) {
    throw new Error(`Konfigurationsfehler:\n${errors.join('\n')}`);
  }
}

// ========================================
// KONFIGURATION EXPORTIEREN
// ========================================
export const config = {
  database: databaseConfig,
  jwt: jwtConfig,
  app: appConfig,
} as const;

// Validierung beim Laden des Moduls
if (typeof window === 'undefined') {
  // Nur auf Server-Seite validieren
  try {
    validateConfig();
    console.log('✅ Konfiguration erfolgreich geladen');
  } catch (error) {
    console.error('❌ Konfigurationsfehler:', error);
    if (appConfig.nodeEnv === 'production') {
      throw error;
    }
  }
}

// ========================================
// HILFSFUNKTIONEN
// ========================================
export function isDevelopment(): boolean {
  return appConfig.nodeEnv === 'development';
}

export function isProduction(): boolean {
  return appConfig.nodeEnv === 'production';
}

export function isTest(): boolean {
  return appConfig.nodeEnv === 'test';
}

export function getDatabaseUrl(): string {
  const { host, port, user, password, database } = databaseConfig;
  return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

// ========================================
// TYPEN
// ========================================
export type DatabaseConfig = typeof databaseConfig;
export type JWTConfig = typeof jwtConfig;
export type AppConfig = typeof appConfig;
export type Config = typeof config; 