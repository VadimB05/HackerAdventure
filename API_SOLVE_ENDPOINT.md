# Universeller Solve-Endpunkt

## POST /api/game/solve

Ein universeller Endpunkt zum Lösen von Rätseln aller Typen. Der Endpunkt validiert die Antwort basierend auf dem Rätseltyp und aktualisiert den Spielerfortschritt entsprechend.

## Authentifizierung

**Erforderlich**: Bearer Token im Authorization-Header
```
Authorization: Bearer <jwt-token>
```

## Request Body

```typescript
interface SolveRequest {
  puzzleId: string;           // ID des zu lösenden Rätsels
  answer: string | string[];  // Antwort (String oder Array für Multi-Question)
  questionId?: string;        // Optional: Frage-ID für Multi-Question Rätsel
  timeSpent?: number;         // Optional: Verbrachte Zeit in Sekunden
}
```

### Beispiele

**Terminal-Rätsel:**
```json
{
  "puzzleId": "terminal_1",
  "answer": "ssh admin@server",
  "timeSpent": 45
}
```

**Code-Rätsel:**
```json
{
  "puzzleId": "password_hash_1",
  "answer": "hello"
}
```

**Multiple-Choice (Einzelne Frage):**
```json
{
  "puzzleId": "mc_1",
  "answer": "2"
}
```

**Multi-Question Rätsel:**
```json
{
  "puzzleId": "multi_question_1",
  "questionId": "1",
  "answer": "3"
}
```

**Sequenz-Rätsel:**
```json
{
  "puzzleId": "sequence_1",
  "answer": ["1", "2", "3", "4"]
}
```

## Response

### Erfolgreiche Lösung

```typescript
interface SolveResponse {
  success: true;
  isCorrect: true;
  attempts: number;
  message: string;
  rewardExp?: number;
  rewardBitcoins?: number;
  rewardItems?: string[];
  unlockedRooms?: string[];
  unlockedItems?: string[];
}
```

**Beispiel:**
```json
{
  "success": true,
  "isCorrect": true,
  "attempts": 2,
  "message": "Rätsel erfolgreich gelöst!",
  "rewardExp": 150,
  "rewardBitcoins": 0.025,
  "rewardItems": ["key_1", "tool_1"]
}
```

### Falsche Antwort

```typescript
interface SolveResponse {
  success: false;
  isCorrect: false;
  attempts: number;
  message: string;
  hints?: string[];
}
```

**Beispiel:**
```json
{
  "success": false,
  "isCorrect": false,
  "attempts": 3,
  "message": "Falsche Antwort. Versuche es nochmal!",
  "hints": ["Der Befehl beginnt mit 'ssh'"]
}
```

### Fehler

```json
{
  "success": false,
  "error": "Fehlermeldung"
}
```

## Rätseltyp-spezifische Validierung

### Terminal-Rätsel (`terminal`, `terminal_command`)
- **Validierung**: Case-insensitive String-Vergleich
- **Beispiel**: `"SSH ADMIN@SERVER"` = `"ssh admin@server"`

### Code/Passwort-Rätsel (`code`, `password`)
- **Validierung**: Exakter String-Vergleich (trimmed)
- **Beispiel**: `"hello"` = `"hello"`

### Multiple-Choice (`multiple_choice`)
- **Validierung**: Index-Vergleich
- **Einzelne Frage**: `answer` = `"2"` (Index der richtigen Option)
- **Multi-Question**: `questionId` + `answer` für spezifische Frage

### Sequenz/Pattern-Rätsel (`sequence`, `pattern`)
- **Validierung**: Array-Vergleich (alle Elemente müssen übereinstimmen)
- **Beispiel**: `["1", "2", "3"]` = `["1", "2", "3"]`

### Logik-Rätsel (`logic`)
- **Validierung**: String-Vergleich
- **Erweiterbar**: Für komplexe Logik-Validierung

### Point-and-Click (`point_and_click`)
- **Validierung**: String-Vergleich (Koordinaten oder Objekt-ID)
- **Beispiel**: `"click_door"` oder `"100,200"`

## Datenbank-Updates

### Bei korrekter Lösung:
1. **puzzle_progress**: Rätsel als gelöst markieren
2. **game_states**: XP, Bitcoins und Fortschritt aktualisieren
3. **best_time_seconds**: Beste Zeit speichern (falls Zeitlimit)

### Bei falscher Antwort:
1. **puzzle_progress**: Versuche erhöhen
2. **Hinweise**: Automatisch nächsten Hinweis bereitstellen

## Sicherheitsfeatures

- **Authentifizierung**: JWT-Token erforderlich
- **Versuche-Limit**: Maximale Versuche pro Rätsel
- **Fortschritt-Tracking**: Verhindert doppelte Belohnungen
- **Zeit-Tracking**: Beste Zeiten für Zeitlimit-Rätsel

## Fehlerbehandlung

| HTTP Status | Fehler | Beschreibung |
|-------------|--------|--------------|
| 400 | Bad Request | Fehlende Parameter |
| 401 | Unauthorized | Ungültiger/fehlender Token |
| 404 | Not Found | Rätsel nicht gefunden |
| 429 | Too Many Requests | Maximale Versuche erreicht |
| 500 | Internal Server Error | Server-Fehler |

## Verwendung in Frontend

```typescript
const solvePuzzle = async (puzzleId: string, answer: string) => {
  const response = await fetch('/api/game/solve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      puzzleId,
      answer,
      timeSpent: getTimeSpent()
    })
  });

  const result = await response.json();
  
  if (result.success && result.isCorrect) {
    // Rätsel gelöst - Belohnungen anzeigen
    showRewards(result.rewardExp, result.rewardBitcoins);
  } else {
    // Falsche Antwort - Hinweise anzeigen
    showHints(result.hints);
  }
};
``` 