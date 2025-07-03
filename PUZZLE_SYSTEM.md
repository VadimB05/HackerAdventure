# Rätsel-System Dokumentation

## Übersicht

Das Rätsel-System ist ein modulares Frontend-System für das Hacker-Adventure-Spiel und unterstützt verschiedene Rätseltypen. Die Komponenten sind so aufgebaut, dass sie flexibel erweitert und in das Spiel integriert werden können.

## Komponenten

### 1. PuzzleMultipleChoice (`components/game/puzzle-multiple-choice.tsx`)

Die Hauptkomponente für Multiple-Choice-Rätsel bietet folgende Features:

#### Features:
- Radio-Button-Auswahl: Spieler wählen eine Antwort aus mehreren Optionen
- Zeitlimit: Countdown-Timer mit Warnungen bei knapper Zeit
- Versuchsanzahl: Tracking der Versuche mit Fortschrittsbalken
- Hinweise: Mehrere Hinweise können nacheinander freigeschaltet werden
- Belohnungen: Anzeige von Geld- und XP-Belohnungen bei Erfolg
- Erklärungen: Optionale Erklärungen nach erfolgreicher Lösung
- Responsive Design: Anpassung an verschiedene Bildschirmgrößen
- Animationen: Smooth Transitions mit Framer Motion

#### Props:
```typescript
interface PuzzleMultipleChoiceProps {
  puzzleId: string;
  puzzleData: {
    name: string;
    description: string;
    difficulty: number;
    maxAttempts: number;
    timeLimitSeconds?: number;
    rewardMoney: number;
    rewardExp: number;
    hints: string[];
    data: {
      multiple_choice: {
        question: string;
        options: string[];
        correct_answer: string;
        explanation?: string;
      };
    };
    progress: {
      isCompleted: boolean;
      attempts: number;
      hintsUsed: number;
    };
  };
  onSolve: (puzzleId: string, isCorrect: boolean) => void;
  onClose: () => void;
}
```

### 2. PuzzleSystem (`components/game/puzzle-system.tsx`)

Die Wrapper-Komponente lädt verschiedene Rätseltypen und zeigt sie an:

#### Features:
- Dynamisches Laden der Rätseldaten über die API
- Typ-Erkennung und Weiterleitung an die passende Komponente
- Fehlerbehandlung mit Retry-Option
- Ladeanimationen während API-Calls

#### Unterstützte Rätseltypen:
- `multiple_choice` – Vollständig implementiert
- `code` – Platzhalter vorhanden
- `terminal_command` – Platzhalter vorhanden
- `password` – Platzhalter vorhanden
- `sequence` – Platzhalter vorhanden
- `logic` – Platzhalter vorhanden

### 3. PuzzleService (`lib/services/puzzle-service.ts`)

Service-Klasse für API-Operationen:

#### Funktionen:
- `getPuzzle(puzzleId)` – Lädt ein einzelnes Rätsel
- `solvePuzzle(puzzleId, request)` – Sendet Antwort an den Server
- `getRoomPuzzles(roomId)` – Lädt alle Rätsel eines Raums

## Verwendung

### 1. Einfache Integration

```tsx
import PuzzleSystem from '@/components/game/puzzle-system';

function GameComponent() {
  const [activePuzzle, setActivePuzzle] = useState<string | null>(null);

  const handleSolve = (puzzleId: string, isCorrect: boolean) => {
    console.log(`Rätsel ${puzzleId} gelöst: ${isCorrect}`);
    setActivePuzzle(null);
  };

  return (
    <div>
      <button onClick={() => setActivePuzzle('1')}>
        Rätsel starten
      </button>
      
      {activePuzzle && (
        <PuzzleSystem
          puzzleId={activePuzzle}
          onSolve={handleSolve}
          onClose={() => setActivePuzzle(null)}
        />
      )}
    </div>
  );
}
```

### 2. Direkte Multiple-Choice-Verwendung

```tsx
import PuzzleMultipleChoice from '@/components/game/puzzle-multiple-choice';

function CustomPuzzle() {
  const puzzleData = {
    name: "Mein Rätsel",
    description: "Teste dein Wissen",
    difficulty: 2,
    maxAttempts: 3,
    timeLimitSeconds: 60,
    rewardMoney: 100,
    rewardExp: 50,
    hints: ["Hinweis 1", "Hinweis 2"],
    data: {
      multiple_choice: {
        question: "Was ist die richtige Antwort?",
        options: ["A", "B", "C", "D"],
        correct_answer: "a",
        explanation: "Das ist die Erklärung"
      }
    },
    progress: {
      isCompleted: false,
      attempts: 0,
      hintsUsed: 0
    }
  };

  return (
    <PuzzleMultipleChoice
      puzzleId="custom-1"
      puzzleData={puzzleData}
      onSolve={(id, correct) => console.log(correct)}
      onClose={() => console.log('Geschlossen')}
    />
  );
}
```

## API-Integration

### Rätsel abrufen:
```typescript
GET /api/game/puzzles/{puzzleId}
```

### Rätsel lösen:
```typescript
POST /api/game/puzzles/{puzzleId}/solve
{
  "answer": "a",
  "timeSpent": 45
}
```

## Styling

Das System verwendet:
- Tailwind CSS für Styling
- shadcn/ui Komponenten
- Framer Motion für Animationen
- Lucide React für Icons

### Farbthema:
- Hintergrund: Schwarz mit Transparenz
- Primär: Grün (#10B981) für Erfolg/Aktionen
- Sekundär: Gelb für Warnungen/Hinweise
- Fehler: Rot für Fehler/Zeitablauf
- Text: Grün für Überschriften, Grau für Body-Text

## Erweiterbarkeit

### Neue Rätseltypen hinzufügen

1. Komponente erstellen:
```tsx
// components/game/puzzle-code.tsx
export default function PuzzleCode({ puzzleId, puzzleData, onSolve, onClose }) {
  // Implementation
}
```

2. PuzzleSystem erweitern:
```tsx
case 'code':
  return (
    <PuzzleCode
      puzzleId={puzzleId}
      puzzleData={puzzleData}
      onSolve={handleSolve}
      onClose={onClose}
    />
  );
```

3. API-Route erweitern (falls nötig)

## Testen

### Demo-Seite
Besuche `/test-puzzle` um das System zu testen.

### Verfügbare Test-Rätsel
- ID 1: Netzwerk-Grundlagen
- ID 2: Sicherheitsprotokolle
- ID 3: Linux-Befehle

## Nächste Schritte

1. Weitere Rätseltypen implementieren:
   - Code-Analyse-Rätsel
   - Terminal-Befehle-Rätsel
   - Passwort/Hash-Rätsel
   - Zahlenfolge-Rätsel
   - Logik-Rätsel

2. Erweiterte Features:
   - Sound-Effekte
   - Achievements
   - Leaderboards
   - Rätsel-Editor für Admins

3. Performance-Optimierungen:
   - Lazy Loading
   - Caching
   - Preloading 