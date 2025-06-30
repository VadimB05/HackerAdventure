# Alarm-Level System Setup

## Problem mit Foreign Key Constraints

Das Alarm-Level-System benötigt neue Datenbank-Tabellen. Falls du den Fehler "#1452 - Kann Kind-Zeile nicht hinzufügen" bekommst, verwende diese manuellen Schritte:

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

## Alternative: Vereinfachtes Script verwenden

Führe das vereinfachte Script aus:
```bash
mysql -u root -p < scripts/setup-alarm-level-simple.sql
```

## Funktionsweise

Nach dem Setup:
1. **Alarm-Level beginnt bei 0** (nicht sichtbar)
2. **Bei Fehlern** wird das Level erhöht
3. **Ab Level 1** wird "ALARM: X/10" in der oberen Leiste angezeigt
4. **Bei Level 10** kommt das FBI und das Spiel wird zurückgesetzt

## Testen

1. Gehe zu einem Rätsel
2. Gib eine falsche Antwort ein
3. Das Alarm-Level sollte auf 1 steigen und sichtbar werden 