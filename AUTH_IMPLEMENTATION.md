# Authentifizierung – Implementierung

## Übersicht

Die Authentifizierung für das INTRUSION-Spiel umfasst:

- **Registrierung** mit Validierung
- **JWT-basierte Anmeldung**
- **Middleware** für automatische Token-Validierung
- **Benutzerfreundliche Login/Register-Seite**

## Komponenten

### 1. Validierung (`lib/validation.ts`)

- **Zod-Schemas** für Eingabevalidierung
- **Registrierung**:
  - Username: 3–50 Zeichen, alphanumerisch, `_` und `-` erlaubt
  - Passwort: Mindestens 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen
  - E-Mail: Optional, gültiges Format
  - Passwort-Bestätigung: Muss übereinstimmen

### 2. Auth-Service (`lib/services/auth-service.ts`)

- **registerUser()**: Registriert Benutzer mit Passwort-Hashing
- **loginUser()**: Anmeldung mit Passwort-Verifikation
- **getUserById()**: Benutzer abrufen
- **Automatische Spielstand-Erstellung** für neue Benutzer

### 3. API-Endpunkte

#### POST `/api/auth/register`
```json
{
  "username": "string",
  "email": "string (optional)",
  "password": "string"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Benutzer erfolgreich registriert",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

#### POST `/api/auth/login`
```json
{
  "username": "string",
  "password": "string"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Anmeldung erfolgreich",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "isAdmin": false
  }
}
```

#### POST `/api/auth/logout`
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Erfolgreich abgemeldet"
}
```

### 4. Middleware (`middleware.ts`)

- **Automatische Token-Validierung** für geschützte Routen
- **Cookie-basierte Authentifizierung** (`httpOnly`, `secure`)
- **Automatische Weiterleitung** zur Auth-Seite bei fehlender Authentifizierung
- **User-Info-Injection** in Request-Headers

### 5. Auth-Utils (`lib/auth-utils.ts`)

- **requireAuth()**: Middleware für geschützte API-Routen
- **requireAdmin()**: Middleware für Admin-Routen
- **Hilfsfunktionen** für User-ID, Username, Admin-Status

### 6. UI-Komponenten

#### Auth-Seite (`/auth`)
- **Tab-basierte Navigation** zwischen Login und Register
- **Echtzeit-Validierung** mit visuellen Hinweisen
- **Passwort-Sichtbarkeit** Toggle
- **Loading-States** und Error-Handling
- **Responsive Design** mit Tailwind CSS

## Sicherheitsfeatures

### Passwort-Sicherheit
- **Bcrypt-Hashing** mit 12 Salt-Rounds
- **Starke Passwort-Anforderungen**:
  - Mindestens 8 Zeichen
  - Groß- und Kleinbuchstaben
  - Zahlen
  - Sonderzeichen empfohlen

### JWT-Sicherheit
- **HTTP-Only Cookies** (nicht über JavaScript zugreifbar)
- **Secure-Flag** in Produktion
- **SameSite=Lax** für CSRF-Schutz
- **24-Stunden-Ablaufzeit**

### Validierung
- **Server-seitige Validierung** mit Zod
- **SQL-Injection-Schutz** durch Prepared Statements
- **XSS-Schutz** durch Input-Sanitization

## Datenbank-Integration

### Automatische Spielstand-Erstellung
Bei der Registrierung werden automatisch erstellt:
- **game_states** Eintrag mit Standardwerten
- **player_stats** Eintrag für Statistiken

### Benutzer-Tabelle
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);
```

## Verwendung

### Registrierung testen
```bash
# Entwicklungsserver starten
pnpm run dev

### Auth-Seite verwenden
```bash
# Normale Auth-Seite
http://localhost:3000/auth
```

### API direkt testen
```bash
# Registrierung
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPass123","email":"test@example.com"}'

# Anmeldung
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPass123"}'
```

## Fehlerbehandlung

### Validierungsfehler (400)
```json
{
  "success": false,
  "error": "Validierungsfehler",
  "details": [
    "Benutzername muss mindestens 3 Zeichen lang sein",
    "Passwort muss mindestens 8 Zeichen lang sein"
  ]
}
```

### Authentifizierungsfehler (401)
```json
{
  "success": false,
  "error": "Benutzername oder Passwort ist falsch"
}
```

### Duplikat-Fehler (400)
```json
{
  "success": false,
  "error": "Benutzername bereits vergeben"
}
```

## Nächste Schritte

1. **Admin-Panel** implementieren
2. **Passwort-Reset** Funktionalität
3. **E-Mail-Verifikation** für neue Accounts
4. **Rate-Limiting** für Login-Versuche
5. **Audit-Logging** für Sicherheitsereignisse
6. **Zwei-Faktor-Authentifizierung** (2FA)

## Abhängigkeiten

- `bcryptjs`: Passwort-Hashing
- `jsonwebtoken`: JWT-Token-Generierung
- `zod`: Eingabevalidierung
- `mysql2`: Datenbankverbindung 