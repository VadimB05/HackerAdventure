# Raumwechsel-System

## Übersicht

Das Raumwechsel-System ermöglicht es Spielern, zwischen verschiedenen Räumen zu navigieren, wobei neue Bereiche durch Rätsellösungen oder Item-Einsatz freigeschaltet werden.

## Features

### ✅ **Automatische Freischaltung**
- Rätsel-basierte Freischaltungen
- Item-basierte Freischaltungen
- Level-basierte Freischaltungen
- Mission-basierte Freischaltungen

### ✅ **Visuelle Feedback**
- Freischaltungs-Benachrichtigungen
- "Weiter"-Button für verfügbare Exits
- Raumwechsel-Animationen
- Status-Indikatoren für gesperrte Bereiche

### ✅ **Validierung**
- Level-Anforderungen prüfen
- Item-Anforderungen prüfen
- Rätsel-Status prüfen
- Mission-Fortschritt prüfen

## Architektur

### Datenbank-Tabellen

- **`room_exits`**: Definiert Exits zwischen Räumen
- **`exit_unlocks`**: Tracking von Freischaltungen
- **`room_visits`**: Protokollierung von Raum-Besuchen
- **`rooms`**: Raum-Definitionen

### API-Endpoints

```http
POST /api/game/progress/room
{
  "roomId": "string",
  "missionId": "string"
}

GET /api/game/room/exits?roomId=string
```

### Frontend-Komponenten

- **RoomView**: Erweiterte Raum-Ansicht mit Exit-Logik
- **Freischaltungs-Benachrichtigungen**: Toast-ähnliche Meldungen
- **"Weiter"-Button**: Automatische Anzeige bei verfügbaren Exits
- **Raumwechsel-Animation**: Smooth Transitions

## Integration

### RoomView Props
```typescript
interface RoomViewProps {
  roomId: string;
  onRoomChange?: (newRoomId: string) => void;
  onUnlockNotification?: (message: string) => void;
  // ... andere Props
}
```

### Exit-Definition
```typescript
interface Exit {
  id: string;
  name: string;
  description: string;
  roomId: string;
  isUnlocked: boolean;
  unlockMessage?: string;
}
```

## Freischaltungs-Logik

### 1. Rätsel-basierte Freischaltung
```typescript
// Nach Rätsel-Lösung
const result = await savePuzzleProgress(userId, puzzleId, true);
if (result.success) {
  // Prüfe ob Exit freigeschaltet wurde
  checkForUnlocks();
}
```

### 2. Item-basierte Freischaltung
```typescript
// Nach Item-Verwendung
const result = await useItem(userId, itemId, targetId);
if (result.success && result.progressUpdated) {
  // Prüfe Exit-Freischaltungen
  checkForUnlocks();
}
```

### 3. Level-basierte Freischaltung
```typescript
// Automatisch durch Trigger
// Trigger: check_exit_unlocks
```

## UI-Komponenten

### Freischaltungs-Benachrichtigung
```tsx
<AnimatePresence>
  {showUnlockNotification && (
    <motion.div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="bg-green-900/90 border-green-500">
        <CardContent>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div>
              <h3 className="font-semibold text-green-400">
                Neuer Bereich freigeschaltet!
              </h3>
              <p className="text-sm text-green-300">{unlockMessage}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )}
</AnimatePresence>
```

### "Weiter"-Button
```tsx
<AnimatePresence>
  {availableExits.some(exit => exit.isUnlocked) && (
    <motion.div className="fixed right-4 top-4 z-40">
      <Card className="bg-blue-900/90 border-blue-500">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Weiter</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )}
</AnimatePresence>
```

### Raumwechsel-Animation
```tsx
<AnimatePresence>
  {isChangingRoom && (
    <motion.div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Raumwechsel...</h2>
        <p className="text-gray-300">Lade neuen Bereich</p>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

## Exit-Behandlung

### Click-Handler
```typescript
const handleObjectClick = (object: InteractiveObject) => {
  if (object.type === 'exit') {
    const exit = availableExits.find(e => e.id === object.id);
    if (exit) {
      if (exit.isUnlocked) {
        handleRoomChange(exit.id, exit.roomId);
      } else {
        showFeedbackWithTimer({
          isValid: false,
          message: 'Dieser Ausgang ist noch gesperrt',
          position: { x: 50, y: 50 }
        });
      }
    }
  }
};
```

### Raumwechsel-Funktion
```typescript
const handleRoomChange = async (exitId: string, targetRoomId: string) => {
  if (isChangingRoom) return;
  
  setIsChangingRoom(true);
  
  try {
    const result = await changeRoom(userId, targetRoomId);
    
    if (result.success) {
      onRoomChange?.(targetRoomId);
      
      setTimeout(() => {
        setIsChangingRoom(false);
      }, 1000);
    }
  } catch (error) {
    console.error('Fehler beim Raumwechsel:', error);
    setIsChangingRoom(false);
  }
};
```

## Datenbank-Setup

### SQL-Script ausführen
```bash
mysql -u username -p < scripts/setup-room-exits.sql
```

### Beispiel-Exits
```sql
INSERT INTO room_exits VALUES
('bedroom_to_living_room', 'bedroom', 'living_room', 'Tür zum Wohnzimmer', FALSE, 1, '[]'),
('bedroom_to_kitchen', 'bedroom', 'kitchen', 'Tür zur Küche', TRUE, 2, '["keycard"]'),
('living_room_to_basement', 'living_room', 'basement', 'Tür zum Keller', TRUE, 3, '["basement_key"]');
```

## Konfiguration

### Exit-Anforderungen
```json
{
  "required_level": 3,
  "required_items": ["keycard", "hacking_tool"],
  "unlock_message": "Keller freigeschaltet!",
  "unlock_condition": {
    "puzzle_completed": "basement_puzzle_1",
    "mission_completed": "tutorial_mission"
  }
}
```

### Animation-Einstellungen
```typescript
const animationConfig = {
  duration: 0.5,
  ease: "easeOut",
  delay: 0.1
};
```

## Erweiterte Features

### [ ] Dynamische Exit-Positionen
- Exits basierend auf Raum-Layout
- Kontextuelle Exit-Platzierung

### [ ] Exit-Animationen
- Tür-Öffnungs-Animationen
- Portal-Effekte
- Sound-Effekte

### [ ] Exit-Bedingungen
- Zeit-basierte Freischaltungen
- Multiplayer-basierte Freischaltungen
- Event-basierte Freischaltungen

### [ ] Exit-Historie
- Tracking von Exit-Nutzung
- Statistiken pro Exit
- Belohnungen für Exit-Entdeckung

## Debugging

### Test-APIs
```http
GET /api/debug/room/exits?roomId=bedroom
POST /api/debug/room/unlock?exitId=bedroom_to_kitchen
```

### Logs
- Exit-Freischaltungen werden protokolliert
- Raumwechsel werden getrackt
- Fehler werden detailliert geloggt

## Performance

- ✅ Indizierte Datenbankabfragen
- ✅ Caching von Exit-Status
- ✅ Optimierte Animationen
- ✅ Lazy Loading von Raum-Daten

## Sicherheit

- ✅ Validierung aller Eingaben
- ✅ Level- und Item-Checks
- ✅ SQL-Injection-Schutz
- ✅ Rate Limiting für Raumwechsel 