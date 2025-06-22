# Test-Seite für alle Rätsel-Typen

## Übersicht

Die `/test-all-puzzles` Seite simuliert die Integration aller Rätsel-Typen ins Spiel. Sie dient als Vorbereitung für die spätere Integration in Raum- und Mission-Elemente.

## Features

### 🎮 Spieler-Status
- **Level & XP**: Zeigt aktuelles Level und Erfahrungspunkte
- **Bitcoins**: Aktueller Bitcoin-Bestand (8 Nachkommastellen)
- **Gelöste Rätsel**: Anzahl erfolgreich gelöster Rätsel

### 🧩 Rätsel-Typen

#### 1. **Multiple Choice** (`PuzzleMultipleChoice`)
- **Beispiel**: "Was ist die Standard-Port-Nummer für HTTP?"
- **Lösung**: Index-basiert (0-3)
- **Features**: 
  - Zeitlimit (optional)
  - Hinweise-System
  - Fortschrittsanzeige
  - Trophäe-Animation bei Erfolg

#### 2. **Code/Passwort** (`PuzzleCodeInput`)
- **Beispiel**: "Finde das versteckte Passwort im Code"
- **Lösung**: Exakter String-Vergleich
- **Features**:
  - Passwort-Feld mit Show/Hide
  - Code-Preview
  - Zeitlimit
  - Hinweise
  - Trophäe-Animation

#### 3. **Terminal** (`PuzzleTerminal`)
- **Beispiel**: "Verbinde dich mit dem Server"
- **Lösung**: Terminal-Befehle
- **Features**:
  - Echte Terminal-Oberfläche
  - Befehlsverlauf
  - Spezielle Befehle (`help`, `hint`, `clear`, `status`)
  - Auto-Scroll
  - Zeitlimit

### 🎯 Integration-Simulation

#### API-Aufrufe
```typescript
// Simuliert echten API-Aufruf an /api/game/solve
const response = await fetch('/api/game/solve', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${token}` // In echter Integration
  },
  body: JSON.stringify({
    puzzleId: puzzle.id,
    answer: 'user_answer',
    timeSpent: 45
  })
});
```

#### Fallback-System
- **API verfügbar**: Verwendet echte Datenbank-Belohnungen
- **API nicht verfügbar**: Fallback auf Mock-Daten
- **Fehlerbehandlung**: Graceful Degradation

#### Feedback-System
- **Erfolg**: Grüne Nachricht mit Belohnungen
- **Fehler**: Rote Nachricht mit Versuchszahl
- **Info**: Blaue Nachricht für Hinweise

## Mock-Daten

### Multiple Choice Rätsel
```typescript
mc_1: {
  question: 'Was ist die Standard-Port-Nummer für HTTP?',
  options: ['80', '443', '8080', '21'],
  correctAnswer: '0'
}
```

### Code-Rätsel
```typescript
code_1: {
  question: 'Finde das versteckte Passwort im Code:',
  code: '// Passwort: "admin123"\n// Benutzer: "root"',
  solution: 'admin123'
}
```

### Terminal-Rätsel
```typescript
terminal_1: {
  question: 'Verbinde dich mit dem Server:',
  description: 'Der Server ist unter der IP 192.168.1.100 erreichbar.',
  solution: 'ssh admin@192.168.1.100'
}
```

## Belohnungssystem

### XP-Belohnungen
- **Einfach**: 50-75 XP
- **Mittel**: 80-120 XP  
- **Schwer**: 150+ XP

### Bitcoin-Belohnungen
- **Einfach**: 0.0001-0.0002 BTC
- **Mittel**: 0.0003-0.0004 BTC
- **Schwer**: 0.0005+ BTC

## UI-Features

### Rätsel-Karten
- **Hover-Effekte**: Scale-Animation
- **Status-Anzeige**: Gelöst/ungelöst
- **Schwierigkeits-Badges**: Farbkodiert
- **Belohnungs-Anzeige**: XP und BTC

### Modal-System
- **Overlay**: Dunkler Hintergrund
- **Responsive**: Max-Breite und Höhe
- **Schließen**: X-Button oder Escape
- **Scroll**: Bei langem Inhalt

### Feedback-Alerts
- **Auto-Hide**: Nach 3 Sekunden
- **Farbkodierung**: Grün/Rot/Blau
- **Icons**: Passende Lucide-Icons

## Vorbereitung für Spiel-Integration

### 1. **Raum-Objekte**
```typescript
// Später: Klick auf Objekt löst Rätsel aus
const handleObjectClick = (objectId: string) => {
  const puzzle = getPuzzleForObject(objectId);
  setSelectedPuzzle(puzzle);
};
```

### 2. **Mission-Integration**
```typescript
// Später: Rätsel als Teil von Missionen
const missionPuzzles = getPuzzlesForMission(missionId);
```

### 3. **Authentifizierung**
```typescript
// Später: Echte JWT-Token verwenden
headers: {
  'Authorization': `Bearer ${userToken}`
}
```

### 4. **Fortschritt-Speicherung**
```typescript
// Später: Echte Datenbank-Updates
await updatePlayerProgress(userId, puzzleId, result);
```

## Technische Details

### Komponenten-Struktur
```
TestAllPuzzlesPage
├── GameState Display
├── Feedback Alert
├── Puzzles Grid
│   └── Puzzle Cards
└── Puzzle Modal
    ├── PuzzleMultipleChoice
    ├── PuzzleCodeInput
    └── PuzzleTerminal
```

### State Management
- **Local State**: React useState für UI
- **Game State**: Simuliert Spieler-Fortschritt
- **API State**: Simuliert Backend-Integration

### Error Handling
- **Network Errors**: Fallback auf Mock-Daten
- **API Errors**: Benutzerfreundliche Fehlermeldungen
- **Component Errors**: Graceful Degradation

## Nächste Schritte

1. **Raum-Integration**: Rätsel an Objekte binden
2. **Mission-System**: Rätsel in Missionen einbetten
3. **Authentifizierung**: Echte JWT-Token verwenden
4. **Datenbank**: Echte Spieler-Fortschritt speichern
5. **Sound-Effekte**: Audio-Feedback hinzufügen
6. **Animationen**: Erweiterte UI-Animationen

## Verwendung

1. Navigiere zu `/test-all-puzzles`
2. Klicke auf ein Rätsel-Karte
3. Löse das Rätsel im Modal
4. Beobachte Belohnungen und Feedback
5. Teste verschiedene Rätsel-Typen
6. Überprüfe API-Integration (falls verfügbar)

Diese Test-Seite dient als vollständige Simulation der späteren Spiel-Integration und ermöglicht das Testen aller Rätsel-Features in einer kontrollierten Umgebung. 