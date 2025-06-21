# Sound-Struktur für INTRUSION

## Ordnerstruktur

```
HackerAdventure/public/sounds/
├── ui/
│   ├── button-click.mp3          # Button-Klicks (alle UI-Buttons)
│   ├── notification.mp3          # Allgemeine Benachrichtigungen
│   ├── popup-open.mp3            # Popup-Dialoge öffnen
│   ├── popup-close.mp3           # Popup-Dialoge schließen
│   ├── modal-open.mp3            # Modals öffnen
│   ├── modal-close.mp3           # Modals schließen
│   ├── menu-hover.mp3            # Menü-Hover-Effekte
│   ├── menu-select.mp3           # Menü-Auswahl
│   └── error.mp3                 # Fehlermeldungen
├── game/
│   ├── room-transition.mp3       # Raumwechsel
│   ├── puzzle-solve.mp3          # Puzzle gelöst
│   ├── puzzle-fail.mp3           # Puzzle fehlgeschlagen
│   ├── mission-start.mp3         # Mission startet
│   ├── mission-complete.mp3      # Mission abgeschlossen
│   ├── mission-fail.mp3          # Mission fehlgeschlagen
│   ├── item-pickup.mp3           # Gegenstand aufheben
│   ├── item-use.mp3              # Gegenstand verwenden
│   ├── door-open.mp3             # Tür öffnen
│   ├── door-locked.mp3           # Tür verschlossen
│   ├── computer-boot.mp3         # Computer startet
│   ├── computer-shutdown.mp3     # Computer herunterfahren
│   └── hacking-success.mp3       # Hacking erfolgreich
├── terminal/
│   ├── terminal-boot.mp3         # Terminal startet
│   ├── command-enter.mp3         # Befehl eingegeben
│   ├── command-success.mp3       # Befehl erfolgreich
│   ├── command-error.mp3         # Befehl fehlgeschlagen
│   ├── file-access.mp3           # Datei geöffnet
│   ├── network-scan.mp3          # Netzwerk-Scan
│   ├── ssh-connect.mp3           # SSH-Verbindung
│   ├── ssh-fail.mp3              # SSH-Verbindung fehlgeschlagen
│   └── bitcoin-transaction.mp3   # Bitcoin-Transaktion
├── smartphone/
│   ├── phone-boot.mp3            # Smartphone startet
│   ├── app-open.mp3              # App öffnen
│   ├── app-close.mp3             # App schließen
│   ├── message-receive.mp3       # Nachricht erhalten
│   ├── message-send.mp3          # Nachricht gesendet
│   ├── call-incoming.mp3         # Anruf eingehend
│   ├── call-answer.mp3           # Anruf annehmen
│   ├── call-end.mp3              # Anruf beenden
│   └── notification.mp3          # Smartphone-Benachrichtigung
├── ambient/
│   ├── cyberpunk-background.mp3  # Haupt-Hintergrundmusik
│   ├── room-bedroom.mp3          # Schlafzimmer-Ambiente
│   ├── room-basement.mp3         # Keller-Ambiente
│   ├── room-city.mp3             # Stadt-Ambiente
│   ├── darknet-ambient.mp3       # Darknet-Ambiente
│   └── terminal-ambient.mp3      # Terminal-Ambiente
└── voice/
    ├── intro-narrator.mp3        # Intro-Erzähler
    ├── mission-briefing.mp3      # Mission-Briefing
    ├── puzzle-hint.mp3           # Puzzle-Hinweis
    └── story-dialogue.mp3        # Story-Dialoge
```

## Aktuelle Sound-Verwendungen

### Bereits implementiert:
1. **Money Popup** (`/sounds/cash-register.mp3`) - Geldeingang-Sound
2. **Game Start** (`/sounds/ambient/cyberpunk.mp3`) - Hintergrundmusik beim Spielstart

### Empfohlene neue Sound-Integrationen:

#### UI-Sounds:
- **Button-Clicks**: Alle UI-Buttons (Terminal, Smartphone, Popups)
- **Popup-Sounds**: MessagePopup, ChoicePopup öffnen/schließen
- **Modal-Sounds**: Alle Dialoge und Modals

#### Game-Sounds:
- **Room Transitions**: Beim Raumwechsel
- **Puzzle Sounds**: Bei Puzzle-Lösung/-Fehler
- **Mission Sounds**: Bei Mission-Start/-Abschluss
- **Item Sounds**: Bei Gegenstand-Interaktionen

#### Terminal-Sounds:
- **Command Sounds**: Bei Befehlseingabe
- **File Access**: Bei Dateizugriff
- **Network Operations**: Bei nmap, ssh, etc.

#### Smartphone-Sounds:
- **App Navigation**: Beim Wechsel zwischen Apps
- **Message Sounds**: Bei Nachrichten
- **Notification Sounds**: Bei Benachrichtigungen

#### Ambient-Sounds:
- **Room-specific**: Verschiedene Hintergrundgeräusche pro Raum
- **Context-specific**: Unterschiedliche Ambiente je nach Kontext

## Implementierung

### Sound-Utility verwenden:
```javascript
import { playSound } from "@/lib/sound-utils"

// Beispiel für Button-Click
const handleButtonClick = () => {
  playSound("/sounds/ui/button-click.mp3", 0.3)
  // Button-Logik hier...
}
```

### Sound-Einstellungen:
- Sounds können über die Options-Modal ein-/ausgeschaltet werden
- Lautstärke ist über den Slider einstellbar
- Alle Sounds verwenden die `playSound`-Utility-Funktion

## Prioritäten für Implementation:

### Hoch (Sofort):
1. `ui/button-click.mp3` - Für alle UI-Interaktionen
2. `ui/popup-open.mp3` - Für Popup-Dialoge
3. `game/room-transition.mp3` - Für Raumwechsel
4. `terminal/command-enter.mp3` - Für Terminal-Befehle

### Mittel (Nächste Phase):
1. `smartphone/app-open.mp3` - Für Smartphone-Navigation
2. `game/puzzle-solve.mp3` - Für Puzzle-Lösungen
3. `ambient/room-bedroom.mp3` - Für Raum-Ambiente

### Niedrig (Später):
1. `voice/` - Sprachausgabe
2. `ambient/` - Erweiterte Hintergrundgeräusche
3. Spezielle Effekte für verschiedene Missionen 