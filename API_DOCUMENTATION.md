# INTRUSION API-Dokumentation

Diese Dokumentation beschreibt alle verfügbaren API-Endpunkte für das INTRUSION-Projekt.

## 📋 Übersicht

Die API ist in drei Hauptbereiche unterteilt:

- **🔐 Auth API** (`/api/auth/*`) - Authentifizierung und Benutzerverwaltung
- **🎮 Game API** (`/api/game/*`) - Spiel-Funktionen und -Daten
- **🛠️ Admin API** (`/api/admin/*`) - Editor-Funktionen und Verwaltung

## 🎮 Game API – Alarm-Level und Puzzle-Logik

Das Alarm-Level-System erhöht das Alarm-Level eines Spielers, wenn bei einem Puzzle die maximal erlaubten Fehlversuche erreicht werden. Nach dem Anstieg werden die Versuche für dieses Puzzle serverseitig auf 0 zurückgesetzt. Die Verwaltung erfolgt über die Tabellen `puzzle_progress` und `player_stats`. Die Alarm-UX ist ein zentrales Notify (rot), das mittig angezeigt wird. Die gesamte Logik ist serverseitig und manipulationssicher.

### Rätsel lösen
```http
POST /api/game/puzzles/solve
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
  "puzzleId": "terminal_puzzle_1",
  "answer": "hack system"
}
```

**Response (bei korrekter Lösung):**
```json
{
  "success": true,
  "message": "Rätsel erfolgreich gelöst!",
  "puzzleId": "terminal_puzzle_1",
  "reward": {
    "money": 50,
    "experience": 25,
    "items": ["usb_stick"]
  },
  "alarmLevelIncreased": false
}
```

**Response (bei falscher Lösung, aber noch nicht max. Fehlversuche):**
```json
{
  "success": false,
  "message": "Antwort ist falsch. Versuche es erneut!",
  "puzzleId": "terminal_puzzle_1",
  "attemptsLeft": 1,
  "alarmLevelIncreased": false
}
```

**Response (bei max. Fehlversuchen, Alarm-Level steigt):**
```json
{
  "success": false,
  "message": "Maximale Fehlversuche erreicht. Alarm-Level wurde erhöht!",
  "puzzleId": "terminal_puzzle_1",
  "alarmLevelIncreased": true,
  "newAlarmLevel": 2,
  "attemptsReset": true
}
```

- Das Feld `alarmLevelIncreased` zeigt an, ob das Alarm-Level nach dieser Aktion gestiegen ist.
- Nach einem Alarm-Level-Anstieg werden die Fehlversuche für dieses Puzzle serverseitig zurückgesetzt.
- Im Frontend erscheint ein zentrales, rotes Notify: **"Dein Alarm Level ist gestiegen!"**
- Die Verwaltung läuft ausschließlich über `puzzle_progress` und `player_stats`.

### Spielstand abrufen
```http
GET /api/game/state
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "gameState": {
    "currentRoom": "basement",
    "money": 150.00,
    "experiencePoints": 75,
    "level": 2,
    "alarmLevel": 2,
    "inventory": ["laptop", "usb_stick"],
    "progress": {
      "basement": { "completed": true },
      "city_view": { "completed": false }
    }
  }
}
```

- Das Feld `alarmLevel` gibt das aktuelle Alarm-Level des Spielers an.

## 🔐 Auth API

### Health Check
```http
GET /api/auth/health
```

**Response:**
```json
{
  "success": true,
  "message": "Auth API ist erreichbar",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "healthy"
}
```

### Benutzer-Anmeldung
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "player1"
  },
  "token": "jwt_token_here"
}
```

### Benutzer-Registrierung
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newplayer",
  "password": "password123",
  "email": "newplayer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Benutzer erfolgreich erstellt",
  "user": {
    "id": 2,
    "username": "newplayer"
  }
}
```

### Token-Verifikation
```http
GET /api/auth/verify
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "player1"
  },
  "message": "Token ist gültig"
}
```

### Benutzer-Abmeldung
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Erfolgreich abgemeldet"
}
```

## 🛠️ Admin API

### Health Check
```http
GET /api/admin/health
Authorization: Bearer admin_jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Admin API ist erreichbar",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "healthy",
  "version": "1.0.0",
  "features": ["rooms", "puzzles", "items", "users"]
}
```

### Alle Räume für Admin
```http
GET /api/admin/rooms
Authorization: Bearer admin_jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "rooms": [
    {
      "id": "intro",
      "name": "Einführung",
      "description": "Willkommen in der Welt des ethischen Hackings",
      "isLocked": false,
      "requiredLevel": 1,
      "missionId": "tutorial",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### Neuen Raum erstellen
```http
POST /api/admin/rooms
Content-Type: application/json
Authorization: Bearer admin_jwt_token_here

{
  "name": "Neuer Raum",
  "description": "Beschreibung des neuen Raums",
  "requiredLevel": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Raum erfolgreich erstellt",
  "room": {
    "id": "room_1705312200000",
    "name": "Neuer Raum",
    "description": "Beschreibung des neuen Raums",
    "requiredLevel": 2,
    "isLocked": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Alle Rätsel für Admin
```http
GET /api/admin/puzzles
Authorization: Bearer admin_jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "puzzles": [
    {
      "id": "terminal_puzzle_1",
      "name": "Terminal-Hack",
      "type": "terminal",
      "difficulty": 1,
      "roomId": "basement",
      "solution": { "command": "hack system" },
      "hints": ["Versuche es mit einem Hack-Befehl"],
      "rewardMoney": 50,
      "rewardExp": 25,
      "isRequired": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### Neues Rätsel erstellen
```http
POST /api/admin/puzzles
Content-Type: application/json
Authorization: Bearer admin_jwt_token_here

{
  "name": "Neues Rätsel",
  "type": "terminal",
  "roomId": "basement",
  "solution": { "command": "new command" },
  "difficulty": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rätsel erfolgreich erstellt",
  "puzzle": {
    "id": "puzzle_1705312200000",
    "name": "Neues Rätsel",
    "type": "terminal",
    "roomId": "basement",
    "solution": { "command": "new command" },
    "difficulty": 2,
    "isRequired": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Alle Benutzer für Admin
```http
GET /api/admin/users
Authorization: Bearer admin_jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@intrusion.com",
      "isAdmin": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLogin": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

### Benutzer-Status ändern
```http
PATCH /api/admin/users
Content-Type: application/json
Authorization: Bearer admin_jwt_token_here

{
  "userId": 2,
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Benutzer 2 Status erfolgreich geändert",
  "user": {
    "id": 2,
    "isActive": false
  }
}
```

## 🔒 Authentifizierung

### JWT-Token Format
Alle geschützten Endpunkte erwarten einen JWT-Token im Authorization-Header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Admin-Berechtigung
Admin-Endpunkte erfordern zusätzlich Admin-Berechtigung im JWT-Token.

## 📊 HTTP-Status-Codes

- **200 OK** - Erfolgreiche Anfrage
- **201 Created** - Ressource erfolgreich erstellt
- **400 Bad Request** - Ungültige Anfrage
- **401 Unauthorized** - Authentifizierung erforderlich/fehlgeschlagen
- **403 Forbidden** - Keine Berechtigung
- **404 Not Found** - Ressource nicht gefunden
- **500 Internal Server Error** - Server-Fehler

## 🧪 Testing

### Health-Checks testen
```bash
# Auth API
curl http://localhost:3000/api/auth/health

# Game API
curl http://localhost:3000/api/game/health

# Admin API
curl http://localhost:3000/api/admin/health
```

### Authentifizierung testen
```bash
# Registrierung
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123","email":"test@example.com"}'

# Anmeldung
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## 📝 Hinweise

- Alle Endpunkte geben JSON-Responses zurück
- Fehler enthalten immer ein `error`-Feld mit Beschreibung
- Erfolgreiche Responses enthalten ein `success: true`-Feld
- Timestamps sind im ISO 8601 Format
- IDs sind entweder Integer (Datenbank) oder String (Game-Objekte) 