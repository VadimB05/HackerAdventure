# INTRUSION - Setup-Anleitung

Diese Anleitung führt Sie durch die vollständige Einrichtung der INTRUSION Next.js-Umgebung.

## 🚀 Schnellstart

### 1. Voraussetzungen prüfen

Stellen Sie sicher, dass Sie folgende Software installiert haben:

```bash
# Node.js Version prüfen (mindestens 18.x)
node --version

# pnpm installieren (falls nicht vorhanden)
npm install -g pnpm

# MariaDB/MySQL installieren
# Windows: https://mariadb.org/download/
# macOS: brew install mariadb
# Linux: sudo apt install mariadb-server
```

### 2. Projekt einrichten

```bash
# In das Projektverzeichnis wechseln
cd HackerAdventure

# Dependencies installieren
pnpm install

# TypeScript-Konfiguration prüfen
pnpm type-check
```

### 3. Datenbank einrichten

```bash
# MariaDB/MySQL starten
# Windows: MariaDB als Dienst starten
# macOS: brew services start mariadb
# Linux: sudo systemctl start mariadb

# Datenbank-Schema importieren
mysql -u root -p < database-schema.sql
```

### 4. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env.local` Datei im `HackerAdventure` Verzeichnis:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=intrusion_db
DATABASE_USER=root
DATABASE_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production

# Game Configuration
GAME_VERSION=1.0.0
DEBUG_MODE=true
```

### 5. Entwicklungsserver starten

```bash
# Entwicklungsserver starten
pnpm dev
```

Das Spiel ist dann unter `http://localhost:3000` verfügbar.

## 🔧 Detaillierte Konfiguration

### Datenbank-Verbindung testen

Erstellen Sie eine Test-Datei `test-db.js`:

```javascript
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'your_password',
      database: 'intrusion_db'
    });
    
    console.log('✅ Datenbankverbindung erfolgreich!');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`Benutzer in der Datenbank: ${rows[0].count}`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Datenbankverbindungsfehler:', error.message);
  }
}

testConnection();
```

### API-Endpunkte testen

```bash
# Registrierung testen
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Anmeldung testen
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

## 🐛 Fehlerbehebung

### Häufige Probleme

#### 1. Datenbankverbindungsfehler

**Symptom**: `ECONNREFUSED` oder `Access denied`

**Lösung**:
```bash
# MariaDB Status prüfen
sudo systemctl status mariadb

# MariaDB neu starten
sudo systemctl restart mariadb

# Benutzerrechte prüfen
mysql -u root -p
GRANT ALL PRIVILEGES ON intrusion_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Port 3000 bereits belegt

**Symptom**: `Port 3000 is already in use`

**Lösung**:
```bash
# Prozess finden
lsof -i :3000

# Prozess beenden
kill -9 <PID>

# Oder anderen Port verwenden
pnpm dev --port 3001
```

#### 3. TypeScript-Fehler

**Symptom**: TypeScript-Kompilierungsfehler

**Lösung**:
```bash
# TypeScript-Cache löschen
rm -rf .next
rm -rf node_modules/.cache

# Dependencies neu installieren
pnpm install

# TypeScript prüfen
pnpm type-check
```

#### 4. JWT-Fehler

**Symptom**: `JWT_SECRET is not defined`

**Lösung**:
- Stellen Sie sicher, dass `.env.local` existiert
- JWT_SECRET in der Datei definiert ist
- Server neu starten: `pnpm dev`

## 📊 Monitoring

### Logs überwachen

```bash
# Next.js Logs
pnpm dev 2>&1 | tee logs/nextjs.log

# Datenbank-Logs (MariaDB)
sudo tail -f /var/log/mysql/error.log
```

### Performance-Monitoring

```bash
# Bundle-Analyse
pnpm build
pnpm analyze

# Memory-Usage
node --inspect pnpm dev
```

## 🔒 Sicherheit

### Produktionsumgebung

1. **Umgebungsvariablen**:
   - Starke JWT-Secrets verwenden
   - Datenbank-Passwörter ändern
   - DEBUG_MODE=false setzen

2. **Datenbank**:
   - Dedizierten Datenbankbenutzer erstellen
   - Minimale Rechte vergeben
   - SSL-Verbindung aktivieren

3. **Next.js**:
   - HTTPS aktivieren
   - Security Headers konfigurieren
   - Rate Limiting implementieren

### Beispiel-Produktionskonfiguration

```env
# Production Environment
NODE_ENV=production
DATABASE_HOST=your-db-host
DATABASE_PORT=3306
DATABASE_NAME=intrusion_prod
DATABASE_USER=intrusion_user
DATABASE_PASSWORD=strong_password_here

JWT_SECRET=very-long-random-secret-key-here
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=another-very-long-secret-key

GAME_VERSION=1.0.0
DEBUG_MODE=false
```

## 🧪 Testing

### Unit Tests

```bash
# Tests ausführen
pnpm test

# Tests mit Coverage
pnpm test:coverage

# Tests im Watch-Modus
pnpm test:watch
```

### Integration Tests

```bash
# API-Tests
pnpm test:api

# E2E-Tests
pnpm test:e2e
```

## 📦 Deployment

### Vercel (Empfohlen)

1. Repository zu Vercel verbinden
2. Umgebungsvariablen in Vercel Dashboard setzen
3. Datenbank-Verbindung konfigurieren
4. Deploy

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 📞 Support

Bei Problemen:

1. **Logs prüfen**: `pnpm dev` Output analysieren
2. **Datenbank testen**: Verbindung manuell prüfen
3. **Dependencies**: `pnpm install` erneut ausführen
4. **Cache löschen**: `.next` und `node_modules/.cache` löschen
5. **Issue erstellen**: GitHub Repository verwenden

---

**Viel Erfolg bei der Einrichtung! 🎮** 