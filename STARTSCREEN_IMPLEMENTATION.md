# Startbildschirm - Implementierung

## Übersicht

Der Startbildschirm für das INTRUSION-Spiel wurde vollständig implementiert mit:

- **Hauptmenü** mit drei Hauptoptionen
- **Spielstand-Erkennung** für "Fortsetzen"-Option
- **Optionen-Modal** mit Sprachumschaltung
- **Responsive Design** mit moderner UI
- **Authentifizierung-Integration**

## Implementierte Features

### 1. Hauptmenü-Optionen

#### 🎮 "Neues Spiel starten"
- **Funktion**: Startet ein komplett neues Spiel
- **Verhalten**: 
  - Setzt Spielstand auf Standardwerte zurück
  - Leitet zur Anmeldung weiter (falls nicht angemeldet)
  - Startet direkt das Spiel nach Reset
- **API-Endpunkt**: `POST /api/game/state/reset`

#### 🔄 "Fortsetzen" (bedingt anzeigen)
- **Anzeige**: Nur sichtbar wenn Spielstand vorhanden
- **Bedingung**: 
  - Benutzer angemeldet
  - Spielstand existiert (nicht nur intro)
  - Level > 1 oder Erfahrungspunkte > 0
- **Funktion**: Lädt bestehenden Spielstand
- **API-Endpunkt**: `GET /api/game/state`

#### ⚙️ "Optionen"
- **Modal-Dialog** mit umfangreichen Einstellungen
- **Sprachumschaltung**: Deutsch, Englisch, Spanisch, Französisch
- **Audio-Einstellungen**: Sound/Musik mit Lautstärke-Reglern
- **Darstellung**: Theme-Auswahl (Hell/Dunkel/Auto)
- **Speicherung**: Lokal im Browser (localStorage)

### 2. Game-Context (`lib/contexts/game-context.tsx`)

**Zentrale Spielstandverwaltung:**
```typescript
interface GameContextType {
  user: User | null;
  gameState: GameState | null;
  isLoading: boolean;
  hasGameProgress: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  startNewGame: () => Promise<void>;
  continueGame: () => Promise<void>;
  checkGameProgress: () => Promise<boolean>;
}
```

**Features:**
- **Automatische Authentifizierung** beim Laden
- **Spielstand-Erkennung** und -Verwaltung
- **Globale State-Verwaltung** für alle Komponenten
- **Error-Handling** und Loading-States

### 3. Options-Modal (`components/ui/options-modal.tsx`)

**Sprachumschaltung:**
- 🇩🇪 Deutsch (Standard)
- 🇺🇸 English
- 🇪🇸 Español
- 🇫🇷 Français

**Audio-Einstellungen:**
- Soundeffekte ein/aus mit Lautstärke
- Hintergrundmusik ein/aus mit Lautstärke
- Visuelle Feedback-Icons

**Darstellung:**
- Theme-Auswahl (Hell/Dunkel/Auto)
- Vollbildmodus-Toggle
- Standard-Einstellungen wiederherstellen

### 4. API-Endpunkte

#### `GET /api/auth/verify`
- **Zweck**: Token-Validierung für Frontend
- **Response**: Benutzerdaten bei gültigem Token
- **Status**: 200 (OK), 401 (Nicht authentifiziert)

#### `GET /api/game/state`
- **Zweck**: Spielstand abrufen
- **Response**: Aktueller Spielstand (Raum, Inventar, Fortschritt)
- **Status**: 200 (OK), 404 (Nicht gefunden)

#### `POST /api/game/state/reset`
- **Zweck**: Neues Spiel starten
- **Aktion**: Setzt alle Werte auf Standard zurück
- **Status**: 200 (OK)

## UI/UX-Features

### Design-Elemente
- **Gradient-Hintergrund**: Cyberpunk-Style mit Blau/Schwarz
- **Animated Title**: Pulsierender INTRUSION-Titel
- **Backdrop-Blur**: Moderne Glasmorphismus-Effekte
- **Hover-Effekte**: Interaktive Button-Animationen
- **Loading-States**: Spinner für alle Aktionen

### Responsive Design
- **Mobile-First**: Optimiert für alle Bildschirmgrößen
- **Touch-Friendly**: Große Buttons für mobile Nutzung
- **Flexible Layout**: Passt sich automatisch an

### Benutzerführung
- **Klare Hierarchie**: Wichtige Aktionen prominent platziert
- **Visuelle Hinweise**: Icons für bessere Verständlichkeit
- **Status-Feedback**: Loading-States und Error-Messages
- **Warnungen**: Hinweis für nicht-angemeldete Benutzer

## Technische Implementierung

### State Management
```typescript
// Spielstand-Erkennung
const hasProgress = data.gameState && 
  (data.gameState.currentRoom !== 'intro' || 
   data.gameState.level > 1 || 
   data.gameState.experiencePoints > 0);
```

### Authentifizierung
- **Automatische Token-Validierung** beim Laden
- **Seamless Integration** mit bestehender Auth
- **Graceful Fallbacks** bei Fehlern

### Performance
- **Lazy Loading** für Options-Modal
- **Optimierte API-Calls** mit Caching
- **Minimale Re-Renders** durch Context-Optimierung

## Verwendung

### 1. Startbildschirm aufrufen
```bash
# Entwicklungsserver starten
pnpm dev

# Startbildschirm öffnen
http://localhost:3000
```

### 2. Spiel starten
1. **Registrierung/Anmeldung** (falls noch nicht geschehen)
2. **"Neues Spiel starten"** klicken
3. **Automatische Weiterleitung** zum Spiel

### 3. Optionen anpassen
1. **"Optionen"** Button klicken
2. **Sprache auswählen** (Deutsch/Englisch/Spanisch/Französisch)
3. **Audio-Einstellungen** anpassen
4. **Theme wählen** (Hell/Dunkel/Auto)

## Nächste Schritte

1. **Mehrsprachigkeit**: Übersetzungsdateien implementieren
2. **Audio-System**: Sound-Engine mit den Einstellungen verbinden
3. **Theme-System**: Dark/Light Mode vollständig implementieren
4. **Spielstand-Export**: Backup/Restore-Funktionalität
5. **Tutorial**: Erste-Schritte-Anleitung für neue Spieler

## Abhängigkeiten

- **React Context**: Globale State-Verwaltung
- **Next.js Router**: Navigation und Routing
- **Tailwind CSS**: Styling und Responsive Design
- **Lucide React**: Icons und UI-Elemente
- **Radix UI**: Modal und Form-Komponenten 