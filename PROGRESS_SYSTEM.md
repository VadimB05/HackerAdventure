# Spielfortschritt-System

## Übersicht

Das Spielfortschritt-System verwaltet den Fortschritt der Spieler durch das Spiel, einschließlich gelöster Rätsel, abgeschlossener Missionen, besuchter Räume und gesammelter Items.

## Architektur

### Datenbank-Tabellen

- **`puzzle_progress`**: Fortschritt bei einzelnen Rätseln
- **`mission_progress`**: Fortschritt bei Missionen
- **`room_visits`**: Tracking von Raum-Besuchen
- **`player_stats`**: Gesamtstatistiken des Spielers
- **`game_states`**: Aktueller Spieler-Status

### Services

- **`ProgressService`**: Frontend-Service für Fortschritt-Operationen
- **API-Routen**: Backend-Endpoints für Fortschritt-Verwaltung

## Features

### Rätsel-Fortschritt
- ✅ Speichern von Versuchen und Lösungen
- ✅ Tracking von Bestzeiten
- ✅ Hinweise-Verwendung
- ✅ Automatische Belohnungen (XP, Bitcoins)
- ✅ Level-Up-System

### Mission-Fortschritt
- ✅ Mission-Abschluss-Tracking
- ✅ Rätsel- und Raum-Listen pro Mission
- ✅ Mission-spezifische Belohnungen
- ✅ Automatische Statistiken-Updates

### Raum-System
- ✅ Raum-Wechsel mit Fortschritt-Speicherung
- ✅ Mission-gebundene Räume
- ✅ Level-Anforderungen
- ✅ Raum-Besuch-Tracking

### Item-System
- ✅ Inventar-Verwaltung
- ✅ Item-Verwendung mit Fortschritt-Updates
- ✅ Item-spezifische Effekte

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

- ✅ Authentifizierung erforderlich (TODO: implementieren)
- ✅ SQL-Injection-Schutz
- ✅ Validierung aller Eingaben
- ✅ Transaktionale Updates

## Performance

- ✅ Indizierte Datenbankabfragen
- ✅ Effiziente Joins
- ✅ Caching-Möglichkeiten
- ✅ Batch-Updates für Statistiken

## Erweiterte Features (Zukunft)

- [ ] Achievement-System
- [ ] Leaderboards
- [ ] Spieler-Ranglisten
- [ ] Statistiken-Export
- [ ] Fortschritt-Backup
- [ ] Multiplayer-Fortschritt
- [ ] Cloud-Synchronisation

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

Das System ist rückwärtskompatibel und kann schrittweise eingeführt werden:

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