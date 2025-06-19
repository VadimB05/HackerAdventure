import bcrypt from 'bcryptjs';
import { connectDB, executeQuery, executeQuerySingle } from '@/lib/database';
import { generateToken } from '@/lib/auth';
import { sanitizeUsername } from '@/lib/validation';

/**
 * Auth-Service für Benutzerregistrierung und -anmeldung
 */

export interface User {
  id: number;
  username: string;
  email?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

/**
 * Benutzer registrieren
 */
export async function registerUser(
  username: string,
  password: string,
  email?: string
): Promise<RegisterResult> {
  try {
    const db = await connectDB();
    
    // Username normalisieren
    const normalizedUsername = sanitizeUsername(username);
    
    // Prüfen, ob Benutzer bereits existiert
    const existingUser = await executeQuerySingle<User>(
      'SELECT id, username FROM users WHERE username = ? OR email = ?',
      [normalizedUsername, email]
    );

    if (existingUser) {
      return {
        success: false,
        error: existingUser.username === normalizedUsername 
          ? 'Benutzername bereits vergeben' 
          : 'E-Mail-Adresse bereits vergeben'
      };
    }

    // Passwort hashen
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Benutzer in Datenbank einfügen
    const result = await executeQuery(
      'INSERT INTO users (username, password_hash, email, created_at) VALUES (?, ?, ?, NOW())',
      [normalizedUsername, hashedPassword, email]
    );

    if (!result || result.length === 0) {
      return {
        success: false,
        error: 'Fehler beim Erstellen des Benutzers'
      };
    }

    const insertId = (result as any).insertId;

    // JWT Token generieren
    const token = await generateToken({
      userId: insertId,
      username: normalizedUsername
    });

    // Benutzer-Objekt erstellen
    const user: User = {
      id: insertId,
      username: normalizedUsername,
      email,
      isAdmin: false,
      isActive: true,
      createdAt: new Date()
    };

    // Initialen Spielstand erstellen
    await createInitialGameState(insertId);

    return {
      success: true,
      user,
      token
    };

  } catch (error) {
    console.error('Registrierungsfehler:', error);
    return {
      success: false,
      error: 'Interner Serverfehler bei der Registrierung'
    };
  }
}

/**
 * Benutzer anmelden
 */
export async function loginUser(
  username: string,
  password: string
): Promise<LoginResult> {
  try {
    const db = await connectDB();
    
    // Username normalisieren
    const normalizedUsername = sanitizeUsername(username);
    
    // Benutzer aus Datenbank abrufen
    const user = await executeQuerySingle<{
      id: number;
      username: string;
      password_hash: string;
      email?: string;
      is_admin: boolean;
      is_active: boolean;
      created_at: Date;
      last_login?: Date;
    }>(
      'SELECT id, username, password_hash, email, is_admin, is_active, created_at, last_login FROM users WHERE username = ?',
      [normalizedUsername]
    );

    if (!user) {
      return {
        success: false,
        error: 'Benutzername oder Passwort ist falsch'
      };
    }

    // Prüfen, ob Benutzer aktiv ist
    if (!user.is_active) {
      return {
        success: false,
        error: 'Benutzerkonto ist deaktiviert'
      };
    }

    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Benutzername oder Passwort ist falsch'
      };
    }

    // Last login aktualisieren
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // JWT Token generieren
    const token = await generateToken({
      userId: user.id,
      username: user.username
    });

    // Benutzer-Objekt erstellen
    const userObj: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };

    return {
      success: true,
      user: userObj,
      token
    };

  } catch (error) {
    console.error('Anmeldefehler:', error);
    return {
      success: false,
      error: 'Interner Serverfehler bei der Anmeldung'
    };
  }
}

/**
 * Benutzer anhand ID abrufen
 */
export async function getUserById(userId: number): Promise<User | null> {
  try {
    const user = await executeQuerySingle<{
      id: number;
      username: string;
      email?: string;
      is_admin: boolean;
      is_active: boolean;
      created_at: Date;
      last_login?: Date;
    }>(
      'SELECT id, username, email, is_admin, is_active, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };

  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers:', error);
    return null;
  }
}

/**
 * Initialen Spielstand für neuen Benutzer erstellen
 */
async function createInitialGameState(userId: number): Promise<void> {
  try {
    await executeQuery(
      'INSERT INTO game_states (user_id, current_room, inventory, progress, money, experience_points, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, 'intro', '[]', '{}', 0.00, 0, 1]
    );

    await executeQuery(
      'INSERT INTO player_stats (user_id, puzzles_solved, rooms_visited, total_money_earned, total_exp_earned) VALUES (?, ?, ?, ?, ?)',
      [userId, 0, 0, 0.00, 0]
    );

  } catch (error) {
    console.error('Fehler beim Erstellen des initialen Spielstands:', error);
    // Nicht kritisch - kann später erstellt werden
  }
} 