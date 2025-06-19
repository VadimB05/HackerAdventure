# Quick Start: Authentifizierung testen

## 1. Entwicklungsserver starten

```bash
cd HackerAdventure
pnpm dev
```

Der Server läuft dann unter: `http://localhost:3000`

## 2. Registrierung testen

### Option A: Test-Seite verwenden
- Öffne: `http://localhost:3000/test-register`
- Fülle das Formular aus
- Sieh dir die API-Response an

### Option B: Auth-Seite verwenden
- Öffne: `http://localhost:3000/auth`
- Wechsle zum "Registrieren" Tab
- Registriere einen neuen Benutzer

### Option C: API direkt testen
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123",
    "email": "test@example.com"
  }'
```

## 3. Anmeldung testen

### Option A: Auth-Seite
- Gehe zu: `http://localhost:3000/auth`
- Verwende den "Anmelden" Tab
- Gib deine Zugangsdaten ein

### Option B: API direkt
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123"
  }'
```

## 4. Geschützte Routen testen

Nach erfolgreicher Anmeldung:
- Gehe zu: `http://localhost:3000/game`
- Du solltest automatisch angemeldet werden

## 5. Abmeldung testen

```bash
curl -X POST http://localhost:3000/api/auth/logout
```

## Beispiel-Testdaten

### Gültige Registrierung:
```json
{
  "username": "hacker123",
  "password": "SecurePass123!",
  "email": "hacker@example.com"
}
```

### Ungültige Eingaben (werden abgelehnt):
```json
{
  "username": "ab",  // Zu kurz
  "password": "123", // Zu schwach
  "email": "invalid-email" // Ungültiges Format
}
```

## Fehlerbehandlung

### Häufige Fehler:
- **400**: Validierungsfehler (siehe Response-Details)
- **401**: Falsche Anmeldedaten
- **409**: Benutzername bereits vergeben
- **500**: Server-Fehler

### Debugging:
- Prüfe die Browser-Konsole für JavaScript-Fehler
- Prüfe die Server-Logs für Backend-Fehler
- Verwende die Test-Seite für detaillierte API-Responses

## Datenbank prüfen

Falls du die Datenbank direkt prüfen möchtest:

```sql
-- Benutzer anzeigen
SELECT id, username, email, created_at FROM users;

-- Spielstände anzeigen
SELECT * FROM game_states;

-- Statistiken anzeigen
SELECT * FROM player_stats;
```

## Nächste Schritte

1. **Spiel testen**: Nach der Anmeldung kannst du das Spiel unter `/game` spielen
2. **Admin-Features**: Implementiere Admin-Panel für Benutzerverwaltung
3. **Erweiterte Features**: Passwort-Reset, E-Mail-Verifikation, etc. 