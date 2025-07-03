# Alarm-Level System Setup

## Überblick

Das Alarm-Level-System erhöht das Alarm-Level eines Spielers, wenn bei einem Puzzle die maximal erlaubten Fehlversuche erreicht werden. Die Verwaltung erfolgt über die Tabellen `puzzle_progress` und `player_stats`. Die gesamte Logik ist serverseitig und manipulationssicher.

- Das Alarm-Level steigt, wenn ein Spieler bei einem Puzzle die maximal erlaubten Versuche erreicht hat.
- Nach dem Anstieg werden die Versuche für dieses Puzzle serverseitig auf 0 zurückgesetzt.
- Der Fortschritt wird über `puzzle_progress` und `player_stats` verwaltet.
- Die Alarm-UX ist ein zentrales Notify (rot), das mittig angezeigt wird.
- Die Logik ist serverseitig und kann nicht manipuliert werden.

---

## Schritt 1: Neue Spalten zu player_stats hinzufügen

```sql
USE intrusion_game;

ALTER TABLE player_stats 
ADD COLUMN current_alarm_level INT DEFAULT 0,
ADD COLUMN max_alarm_level_reached INT DEFAULT 0,
ADD COLUMN total_alarm_increases INT DEFAULT 0;
```

## Schritt 2: Alarm-Level-Historie Tabelle erstellen

```sql
CREATE TABLE alarm_level_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alarm_level INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    puzzle_id VARCHAR(100) NULL,
    mission_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_alarm_level (alarm_level),
    INDEX idx_created_at (created_at)
);
```

## Schritt 3: Test-Daten einfügen (optional)

```sql
-- Test-User erstellen
INSERT IGNORE INTO users (id, username, password_hash, email, is_admin) VALUES
(1, 'testuser', '$2b$10$test', 'test@example.com', FALSE);

-- Test-Spieler-Statistiken
INSERT IGNORE INTO player_stats (user_id, current_alarm_level, max_alarm_level_reached, total_alarm_increases) VALUES
(1, 0, 0, 0);

-- Demo-Alarm-Level-Historie
INSERT INTO alarm_level_history (user_id, alarm_level, reason, puzzle_id, mission_id) VALUES
(1, 1, 'Falscher Befehl im Terminal-Rätsel: ls', 'puzzle1', 'mission1_crypto_bank'),
(1, 2, 'Falsche Antwort im Multiple-Choice-Rätsel: Option A', 'puzzle2', 'mission1_crypto_bank'),
(1, 3, 'Falscher Code im Code-Rätsel: password123', 'puzzle3', 'mission1_crypto_bank');

-- Aktuelles Alarm-Level auf 3 setzen (für Demo)
UPDATE player_stats 
SET current_alarm_level = 3, 
    max_alarm_level_reached = 3, 
    total_alarm_increases = 3
WHERE user_id = 1;
```

## Schritt 4: Überprüfung

```sql
-- Überprüfe die Daten
SELECT 
    u.username,
    ps.current_alarm_level,
    ps.max_alarm_level_reached,
    ps.total_alarm_increases
FROM users u
LEFT JOIN player_stats ps ON u.id = ps.user_id
WHERE u.id = 1;

-- Zeige Alarm-Level-Historie
SELECT 
    alarm_level,
    reason,
    puzzle_id,
    mission_id,
    created_at
FROM alarm_level_history 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

## Funktionsweise

- Das Alarm-Level beginnt bei 0 (unsichtbar).
- Bei jedem Puzzle werden die Fehlversuche gezählt (in `puzzle_progress`).
- Wenn die maximal erlaubten Versuche erreicht sind, steigt das Alarm-Level.
- Nach dem Anstieg werden die Versuche für dieses Puzzle serverseitig auf 0 zurückgesetzt.
- Die Verwaltung läuft über `puzzle_progress` und `player_stats`.
- Die Alarm-UX ist ein zentrales Notify (rot, "Dein Alarm Level ist gestiegen!"), das mittig angezeigt wird.
- Die gesamte Logik ist serverseitig und kann nicht manipuliert werden.

## Testen

1. Gehe zu einem Rätsel.
2. Gib mehrmals eine falsche Antwort ein, bis die maximal erlaubten Versuche erreicht sind.
3. Das Alarm-Level steigt um 1, die Versuche werden zurückgesetzt.
4. Es erscheint ein zentrales, rotes Notify: **"Dein Alarm Level ist gestiegen!"**
5. Das Alarm-Level wird sofort im UI aktualisiert.

---

## Alternative: Vereinfachtes Script verwenden

Führe das vereinfachte Script aus:
```bash
mysql -u root -p < scripts/setup-alarm-level-simple.sql
``` 