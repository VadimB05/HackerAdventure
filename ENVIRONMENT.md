# Umgebungskonfiguration - INTRUSION

Diese Dokumentation erklärt, wie die Umgebungsvariablen für das INTRUSION-Projekt konfiguriert werden.

## 🚀 Schnellstart

1. **Kopiere die Beispiel-Datei:**
   ```bash
   cp env.example .env
   ```

2. **Passe die Werte in `.env` an:**
   ```bash
   # Datenbank
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=dein_passwort
   DB_NAME=intrusion_game
   
   # JWT Secret (mindestens 32 Zeichen!)
   JWT_SECRET=dein-super-geheimer-jwt-schlüssel-für-produktion
   ```

3. **Starte die Anwendung:**
   ```bash
   npm run dev
   ```

## 📋 Umgebungsvariablen

### Datenbank-Konfiguration

| Variable | Beschreibung | Standard | Erforderlich |
|----------|--------------|----------|--------------|
| `DB_HOST` | Datenbank-Host | `localhost` | ✅ |
| `DB_PORT` | Datenbank-Port | `3306` | ✅ |
| `DB_USER` | Datenbank-Benutzer | `root` | ✅ |
| `DB_PASSWORD` | Datenbank-Passwort | `` | ✅ |
| `DB_NAME` | Datenbank-Name | `intrusion_game` | ✅ |

### JWT-Authentifizierung

| Variable | Beschreibung | Standard | Erforderlich |
|----------|--------------|----------|--------------|
| `JWT_SECRET` | JWT-Signaturschlüssel | `fallback-secret` | ✅ (Produktion) |
| `JWT_EXPIRES_IN` | Token-Gültigkeit | `24h` | ❌ |

### Anwendungs-Konfiguration

| Variable | Beschreibung | Standard | Erforderlich |
|----------|--------------|----------|--------------|
| `NODE_ENV` | Umgebung | `development` | ❌ |
| `DEBUG` | Debug-Modus | `false` | ❌ |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | CORS-Origins | `localhost:3000` | ❌ |

## 🔒 Sicherheitsrichtlinien

### JWT Secret
- **Mindestens 32 Zeichen** für Produktion
- **Zufällige Zeichenkette** verwenden
- **Niemals im Code hardcodieren**
- **Regelmäßig rotieren**

### Datenbank
- **Starke Passwörter** verwenden (mindestens 12 Zeichen)
- **Separate Benutzer** für verschiedene Umgebungen
- **Minimale Berechtigungen** gewähren

### Allgemein
- **`.env` Dateien niemals committen**
- **Separate Konfigurationen** für verschiedene Umgebungen
- **Regelmäßige Sicherheitsaudits**

## 🌍 Umgebungen

### Development
```bash
NODE_ENV=development
DEBUG=true
```

### Production
```bash
NODE_ENV=production
DEBUG=false
JWT_SECRET=<starkes-secret>
```

### Testing
```bash
NODE_ENV=test
DEBUG=false
```

## 📁 Dateistruktur

```
HackerAdventure/
├── .env                    # Lokale Umgebungsvariablen (nicht in Git)
├── env.example            # Beispiel-Konfiguration
├── lib/
│   ├── config.ts          # Zentrale Konfiguration
│   ├── database.ts        # Datenbankverbindung
│   └── auth.ts           # JWT-Authentifizierung
└── ENVIRONMENT.md         # Diese Dokumentation
```

## 🔧 Konfiguration verwenden

### In Server-Komponenten
```typescript
import { config } from '@/lib/config';

// Datenbank-Konfiguration
const dbHost = config.database.host;

// JWT-Konfiguration
const jwtSecret = config.jwt.secret;

// Anwendungs-Konfiguration
const isDev = config.app.nodeEnv === 'development';
```

### In Client-Komponenten
```typescript
// Nur NEXT_PUBLIC_ Variablen sind verfügbar
const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS;
```

## 🚨 Fehlerbehebung

### "Konfigurationsfehler"
- Überprüfe, ob alle erforderlichen Variablen gesetzt sind
- Validiere die Syntax der `.env` Datei
- Stelle sicher, dass keine Leerzeichen um `=` stehen

### "Datenbankverbindung fehlgeschlagen"
- Überprüfe Datenbank-Host und Port
- Validiere Benutzername und Passwort
- Stelle sicher, dass die Datenbank läuft

### "JWT Secret Warnung"
- Setze ein starkes JWT_SECRET in Produktion
- Verwende mindestens 32 Zeichen
- Rotiere das Secret regelmäßig

## 📚 Weitere Ressourcen

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Database Security](https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration)

## 🤝 Beitragen

Bei Fragen oder Problemen:
1. Überprüfe diese Dokumentation
2. Schaue in die Konsole-Logs
3. Erstelle ein Issue mit detaillierten Informationen 