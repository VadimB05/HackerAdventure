# Spielfortschritt-System

## Übersicht

Das Spielfortschritt-System verwaltet den Fortschritt der Spieler durch das Spiel, einschließlich gelöster Rätsel, abgeschlossener Missionen, besuchter Räume und gesammelter Items.

## Architektur

### Datenbank-Tabellen

- **`puzzle_progress`**: Speichert Versuche, Lösungen und Bestzeiten für einzelne Rätsel
- **`mission_progress`**: Speichert den Abschluss und Fortschritt von Missionen
- **`room_visits`**: Zeichnet besuchte Räume auf
- **`player_stats`**: Hält Gesamtstatistiken des Spielers (z.B. XP, Level, Alarm-Level)
- **`game_states`**: Speichert den aktuellen Status des Spielers

### Services

- **`ProgressService`**: Frontend-Service für Fortschritts-Operationen
- **API-Routen**: Backend-Endpunkte für Fortschritts-Verwaltung

## Features

### Rätsel-Fortschritt
- Speichert Versuche und Lösungen
- Trackt Bestzeiten
- Vermerkt Hinweise-Verwendung
- Vergibt automatisch Belohnungen (XP, Bitcoins, Items)
- Level-Up-System

### Mission-Fortschritt
- Trackt abgeschlossene Missionen
- Listet Rätsel und Räume pro Mission
- Vergibt mission-spezifische Belohnungen
- Aktualisiert automatisch Statistiken

### Raum-System
- Speichert Raum-Wechsel und Fortschritt
- Unterstützt mission-gebundene Räume
- Berücksichtigt Level-Anforderungen
- Trackt Raum-Besuche

### Item-System
- Verwalten des Inventars
- Item-Verwendung mit Fortschritts-Updates
- Item-spezifische Effekte

## API-Endpoints

### Rätsel-Fortschritt
```http
POST /api/game/progress/puzzle
{
  "puzzleId": "string",
  "isCompleted": boolean,
  "attempts": number,
  "timeSpent": number,
  "hintsUsed": number
}
```

### Mission-Fortschritt
```http
POST /api/game/progress/mission
{
  "missionId": "string",
  "isCompleted": boolean,
  "puzzlesCompleted": ["string"],
  "roomsVisited": ["string"]
}
```

### Spieler-Status abrufen
```http
GET /api/game/progress?userId=number
```

### Raum wechseln
```http
POST /api/game/progress/room
{
  "userId": number,
  "roomId": "string",
  "missionId": "string"
}
```

### Item verwenden
```http
POST /api/game/progress/item
{
  "userId": number,
  "itemId": "string",
  "targetId": "string"
}
```

## Integration ins Spiel

### Rätsel-Komponenten
```typescript
import { savePuzzleProgress } from '@/lib/services/progress-service';

// Nach erfolgreichem Rätsel-Lösen
const result = await savePuzzleProgress(
  userId,
  puzzleId,
  true, // isCompleted
  attempts,
  timeSpent,
  hintsUsed
);

if (result.success) {
  // Belohnungen anzeigen
  showRewards(result.rewards);
}
```

### Mission-System
```typescript
import { saveMissionProgress } from '@/lib/services/progress-service';

// Nach Mission-Abschluss
const result = await saveMissionProgress(
  userId,
  missionId,
  true, // isCompleted
  completedPuzzles,
  visitedRooms
);
```

### Raum-Navigation
```typescript
import { changeRoom } from '@/lib/services/progress-service';

// Beim Raum-Wechsel
const result = await changeRoom(userId, newRoomId, missionId);
if (result.success) {
  // Raum wechseln
  navigateToRoom(result.newRoom);
}
```

## Datenbank-Setup

Führe das SQL-Script aus:
```bash
mysql -u username -p < scripts/setup-progress-tables.sql
```

## Automatische Features

### Trigger
- **`update_puzzle_stats`**: Aktualisiert Statistiken bei Rätsel-Lösung
- **`update_mission_stats`**: Aktualisiert Statistiken bei Mission-Abschluss

### Views
- **`player_progress_overview`**: Übersicht über Spieler-Fortschritt

## Level-System

Level werden automatisch basierend auf XP berechnet:
```
Level = Math.floor(experiencePoints / 100) + 1
```

## Belohnungen

### Rätsel-Belohnungen
- XP basierend auf Schwierigkeit
- Bitcoins basierend auf Rätsel-Typ
- Items (optional)

### Mission-Belohnungen
- Höhere XP-Belohnungen
- Größere Bitcoin-Belohnungen
- Spezielle Items
- Raum-Freischaltungen

## Sicherheit

- Authentifizierung erforderlich
- SQL-Injection-Schutz
- Validierung aller Eingaben
- Transaktionale Updates

## Performance

- Indizierte Datenbankabfragen
- Effiziente Joins
- Caching-Möglichkeiten
- Batch-Updates für Statistiken

## Erweiterte Features (Zukunft)

- Achievement-System
- Leaderboards
- Spieler-Ranglisten
- Statistiken-Export
- Fortschritt-Backup
- Multiplayer-Fortschritt
- Cloud-Synchronisation

## Debugging

### Test-APIs
```http
GET /api/debug/progress?userId=1
POST /api/debug/progress/reset?userId=1
```

### Logs
- Alle Fortschritt-Updates werden geloggt
- Fehler werden detailliert protokolliert
- Performance-Metriken verfügbar

## Migration

1. Datenbank-Tabellen erstellen
2. Services implementieren
3. APIs bereitstellen
4. Frontend-Integration
5. Authentifizierung hinzufügen
6. Erweiterte Features

## Support

Bei Problemen:
1. Datenbank-Logs prüfen
2. API-Response analysieren
3. Service-Logs durchsuchen
4. Datenbank-Integrität testen 