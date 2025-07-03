# INTRUSION – Hacker Adventure

Ein Next.js-basiertes Hacker-Adventure-Spiel mit React-Frontend, Node.js-API und MariaDB-Backend.

---

## 🚀 Features

- **Modulares Rätsel- und Fortschrittssystem**  
  → Siehe [PUZZLE_SYSTEM.md](./PUZZLE_SYSTEM.md), [PROGRESS_SYSTEM.md](./PROGRESS_SYSTEM.md)
- **Alarm-Level-System**: Steigt nur bei max. Fehlversuchen, serverseitig, zentrales Notify  
  → Siehe [ALARM_LEVEL_SETUP.md](./ALARM_LEVEL_SETUP.md)
- **Manipulationssichere Logik**: Fortschritt, Versuche und Alarm-Level werden ausschließlich serverseitig verwaltet
- **Admin-UI**: Drag-and-Drop, Fehlerbanner, optimierter Bild-Upload
- **JWT-Authentifizierung**  
  → Siehe [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md)
- **CI/CD-Deployment**: GitHub Actions, SSH, PM2  
  → Siehe [CI_CD_SETUP.md](./CI_CD_SETUP.md)

---

## 🛠 Technologie-Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Radix UI, Tailwind CSS
- **Backend**: Node.js API-Routen, MariaDB/MySQL, mysql2
- **CI/CD**: GitHub Actions, SSH, PM2

---

## 📁 Projektstruktur

```
HackerAdventure/
├── app/                    # Next.js App Router
│   ├── api/               # API-Routen (Backend)
│   └── game/              # Spiel-Seiten
├── components/            # React Komponenten
│   ├── game/              # Spiel-spezifische Komponenten
│   ├── ui/                # UI-Komponenten (Radix UI)
├── lib/                   # Utility-Funktionen
├── hooks/                 # Custom React Hooks
├── public/                # Statische Assets
└── styles/                # Zusätzliche Styles
```

---

## 🏗 Einrichtung

1. **Repository klonen & Abhängigkeiten installieren**
   ```bash
   git clone <repository-url>
   cd HackerAdventure
   pnpm install
   ```
2. **Umgebungsvariablen**: Nur über `.env` (siehe [ENVIRONMENT.md](./ENVIRONMENT.md)), Secrets für Deployment ausschließlich in GitHub Actions
3. **Datenbank einrichten**: Siehe [ALARM_LEVEL_SETUP.md](./ALARM_LEVEL_SETUP.md), [PROGRESS_SYSTEM.md](./PROGRESS_SYSTEM.md), [ROOM_SYSTEM.md](./ROOM_SYSTEM.md)
4. **Entwicklungsserver starten**
   ```bash
   pnpm dev
   ```

---

## 🚀 Deployment

- **Automatisches Deployment**: Jeder Push auf `main` triggert GitHub Actions Workflow (siehe [CI_CD_SETUP.md](./CI_CD_SETUP.md))
- **Server-Voraussetzungen**: Node.js 18+, pnpm, PM2, MariaDB
- **Secrets**: Nur in GitHub Actions

---

## 🔒 Sicherheit

- **JWT-Authentifizierung** (siehe [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md))
- **Serverseitige Validierung** aller Spielfortschritte und Alarm-Level
- **SQL-Injection-Schutz, Input-Validierung**

---

## 📄 API

- **Universeller Solve-Endpoint**: `/api/game/solve` (siehe [API_SOLVE_ENDPOINT.md](./API_SOLVE_ENDPOINT.md))
- **Alle Endpunkte und Response-Formate**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 📚 Weitere Dokumentation

- [ALARM_LEVEL_SETUP.md](./ALARM_LEVEL_SETUP.md)
- [PUZZLE_SYSTEM.md](./PUZZLE_SYSTEM.md)
- [PROGRESS_SYSTEM.md](./PROGRESS_SYSTEM.md)
- [ROOM_SYSTEM.md](./ROOM_SYSTEM.md)
- [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md)
- [API_SOLVE_ENDPOINT.md](./API_SOLVE_ENDPOINT.md)
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [CI_CD_SETUP.md](./CI_CD_SETUP.md)

---

## 🆘 Support

Bei Fragen oder Problemen siehe Issues oder die jeweiligen .md-Dokumente.

---

## 📄 Lizenz

Dieses Projekt unterliegt dem Urheberrecht des Autors. Die Nutzung ist ausschließlich für private, nicht-kommerzielle Zwecke gestattet. Jegliche kommerzielle Nutzung, Weitergabe oder Veröffentlichung – ganz oder in Teilen – ist ohne ausdrückliche schriftliche Genehmigung des Urhebers untersagt.

