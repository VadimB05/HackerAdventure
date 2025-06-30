-- Alarm-Level System Test Script
-- Führt die neuen Tabellen und Test-Daten ein

USE intrusion_game;

-- Neue Spalten zu player_stats hinzufügen (falls noch nicht vorhanden)
ALTER TABLE player_stats 
ADD COLUMN IF NOT EXISTS current_alarm_level INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_alarm_level_reached INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_alarm_increases INT DEFAULT 0;

-- Alarm-Level-Historie Tabelle erstellen (falls noch nicht vorhanden)
-- Ohne Foreign Key Constraints für puzzle_id und mission_id, da diese Tabellen möglicherweise andere IDs haben
CREATE TABLE IF NOT EXISTS alarm_level_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alarm_level INT NOT NULL, -- Neues Alarm-Level (1-10)
    reason VARCHAR(255) NOT NULL, -- Grund für die Erhöhung
    puzzle_id VARCHAR(100) NULL, -- Optional: Welches Rätsel (ohne FK-Constraint)
    mission_id VARCHAR(100) NULL, -- Optional: Welche Mission (ohne FK-Constraint)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_alarm_level (alarm_level),
    INDEX idx_created_at (created_at)
);

-- Test-User erstellen (falls nicht vorhanden)
INSERT IGNORE INTO users (id, username, password_hash, email, is_admin) VALUES
(1, 'testuser', '$2b$10$test', 'test@example.com', FALSE);

-- Test-Spieler-Statistiken erstellen
INSERT IGNORE INTO player_stats (user_id, current_alarm_level, max_alarm_level_reached, total_alarm_increases) VALUES
(1, 0, 0, 0);

-- Test-Alarm-Level-Historie (für Demo-Zwecke)
-- Verwende existierende Puzzle- und Mission-IDs aus der Datenbank
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

-- Überprüfung der Daten
SELECT 
    u.username,
    ps.current_alarm_level,
    ps.max_alarm_level_reached,
    ps.total_alarm_increases,
    COUNT(alh.id) as history_entries
FROM users u
LEFT JOIN player_stats ps ON u.id = ps.user_id
LEFT JOIN alarm_level_history alh ON u.id = alh.user_id
WHERE u.id = 1
GROUP BY u.id, u.username, ps.current_alarm_level, ps.max_alarm_level_reached, ps.total_alarm_increases;

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