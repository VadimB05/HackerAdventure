# INTRUSION - Hacker Adventure

Ein Next.js-basiertes Hacker-Adventure-Spiel mit React Frontend und Node.js API Backend.

## 🎮 Projektübersicht

INTRUSION ist ein interaktives Hacker-Adventure-Spiel, das verschiedene Rätseltypen (Point-and-Click, Terminal) und ein Inventarsystem bietet. Das Spiel verwendet eine modulare Struktur für Missionen/Räume und datengetriebenes Level-Design.

## 🛠 Technologie-Stack

- **Frontend**: Next.js 15 mit App Router, React 19, TypeScript
- **Backend**: Node.js API-Routen in Next.js
- **Datenbank**: MariaDB (MySQL-kompatibel) mit mysql2
- **Authentifizierung**: JWT-basiert
- **UI**: Radix UI Komponenten mit Tailwind CSS
- **Styling**: Tailwind CSS mit Dark Mode Support

## 📁 Projektstruktur

```
HackerAdventure/
├── app/                    # Next.js App Router
│   ├── api/               # API-Routen (Backend)
│   │   ├── auth/          # Authentifizierung
│   │   └── game/          # Spiel-Logik
│   ├── game/              # Spiel-Seiten
│   ├── globals.css        # Globale Styles
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # Startseite
├── components/            # React Komponenten
│   ├── game/              # Spiel-spezifische Komponenten
│   ├── ui/                # UI-Komponenten (Radix UI)
│   └── theme-provider.tsx # Theme Provider
├── lib/                   # Utility-Funktionen
│   ├── auth.ts           # JWT-Authentifizierung
│   ├── database.ts       # Datenbankverbindung
│   └── utils.ts          # Allgemeine Utilities
├── hooks/                 # Custom React Hooks
├── public/                # Statische Assets
└── styles/                # Zusätzliche Styles
```

## 🚀 Einrichtung

### Voraussetzungen

- Node.js 18+ 
- pnpm (empfohlen) oder npm
- MariaDB/MySQL Datenbank

### 1. Repository klonen

```bash
git clone <repository-url>
cd HackerAdventure
```

### 2. Dependencies installieren

```bash
pnpm install
```

### 3. Umgebungsvariablen konfigurieren

**Option A: Automatisches Setup (empfohlen)**
```bash
pnpm run setup-env
```

**Option B: Manuelles Setup**
```bash
# Kopiere die Beispiel-Konfiguration
cp env.example .env

# Bearbeite die .env Datei mit deinen Werten
```

**Erforderliche Umgebungsvariablen:**
```env
# ========================================
# DATENBANK-KONFIGURATION
# ========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=intrusion_game

# ========================================
# JWT-AUTHENTIFIZIERUNG
# ========================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ========================================
# NEXT.JS-KONFIGURATION
# ========================================
NODE_ENV=development
DEBUG=false
```

**Wichtige Hinweise:**
- Die `.env` Datei ist bereits in `.gitignore` enthalten
- Ändere das `JWT_SECRET` in Produktion (mindestens 32 Zeichen)
- Verwende starke Passwörter für die Datenbank
- Siehe `ENVIRONMENT.md` für detaillierte Dokumentation

### 4. Datenbank einrichten

```sql
-- Datenbank erstellen
CREATE DATABASE intrusion_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Benutzer-Tabelle erstellen
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Spielstand-Tabelle erstellen
CREATE TABLE game_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_room VARCHAR(100) NOT NULL,
    inventory JSON,
    progress JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5. Entwicklungsserver starten

```bash
pnpm dev
```

Das Spiel ist dann unter `http://localhost:3000` verfügbar.

## 🔧 Verfügbare Scripts

- `pnpm dev` - Entwicklungsserver starten
- `pnpm build` - Produktions-Build erstellen
- `pnpm start` - Produktions-Server starten
- `pnpm lint` - ESLint ausführen
- `pnpm type-check` - TypeScript-Typen prüfen
- `pnpm setup-env` - Umgebungskonfiguration einrichten

## 🏗 Architektur

### Frontend (Client-Side)
- **React Components**: Modulare UI-Komponenten
- **Game Context**: Zustandsverwaltung für das Spiel
- **Responsive Design**: Mobile-first Ansatz
- **Dark Mode**: Unterstützung für dunkles Theme

### Backend (Server-Side)
- **API Routes**: RESTful Endpoints in `/app/api/`
- **Authentication**: JWT-basierte Authentifizierung
- **Database**: Sichere SQL-Abfragen mit mysql2
- **Validation**: Input-Validierung mit Zod

### Datenbank
- **MariaDB**: MySQL-kompatible Datenbank
- **Connection Pooling**: Optimierte Datenbankverbindungen
- **JSON Storage**: Flexible Speicherung für Spielstände

## 🔒 Sicherheit

- **Password Hashing**: bcryptjs für sichere Passwort-Speicherung
- **JWT Tokens**: Sichere Session-Verwaltung
- **SQL Injection Protection**: Prepared Statements
- **Input Validation**: Umfassende Eingabevalidierung
- **CORS**: Konfigurierte Cross-Origin Resource Sharing
- **Environment Variables**: Sichere Konfigurationsverwaltung

## 🧪 Testing

Das Projekt ist für Unit- und Integrationstests vorbereitet:

- **Pure Functions**: Puzzle-Logik als testbare Funktionen
- **API Testing**: Endpoint-Tests möglich
- **Component Testing**: React-Komponenten-Tests

## 📈 Performance

- **Code Splitting**: Automatisches Code-Splitting durch Next.js
- **Image Optimization**: Next.js Image-Komponente
- **Database Optimization**: Connection Pooling
- **Caching**: Strategien für bessere Performance

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch
3. Committen Sie Ihre Änderungen
4. Pushen Sie zum Branch
5. Erstellen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository.