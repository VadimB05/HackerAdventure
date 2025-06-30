-- Progress-Tabellen Setup Script
-- Führt die notwendigen Tabellen für das Progress-System ein

USE intrusion_game;

-- Test-User erstellen (falls nicht vorhanden)
INSERT IGNORE INTO users (id, username, password_hash, email, is_admin) VALUES
(1, 'testuser', '$2b$10$test', 'test@example.com', FALSE);

-- Game-States Tabelle erstellen (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS game_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_room VARCHAR(100) NOT NULL DEFAULT 'intro',
    current_mission VARCHAR(100) NULL,
    inventory JSON DEFAULT '[]',
    progress JSON DEFAULT '{}',
    bitcoins DECIMAL(10,8) DEFAULT 0.25000000,
    experience_points INT DEFAULT 0,
    level INT DEFAULT 1,
    health INT DEFAULT 100,
    energy INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_current_room (current_room),
    INDEX idx_current_mission (current_mission)
);

-- Puzzle-Progress Tabelle erstellen (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS puzzle_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzle_id VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    best_time_seconds INT NULL,
    completed_at TIMESTAMP NULL,
    hints_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_puzzle (user_id, puzzle_id),
    INDEX idx_user_id (user_id),
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_is_completed (is_completed)
);

-- Mission-Progress Tabelle erstellen (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS mission_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mission_id VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    puzzles_completed INT DEFAULT 0,
    rooms_visited INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_mission (user_id, mission_id),
    INDEX idx_user_id (user_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_is_completed (is_completed)
);

-- Player-Inventory Tabelle erstellen (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS player_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    durability INT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_item (user_id, item_id),
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id)
);

-- Test-Game-State erstellen (falls nicht vorhanden)
INSERT IGNORE INTO game_states (user_id, current_room, current_mission, bitcoins, experience_points, level) VALUES
(1, 'intro', NULL, 0.25000000, 0, 1);

-- Test-Puzzle-Progress (falls nicht vorhanden)
INSERT IGNORE INTO puzzle_progress (user_id, puzzle_id, is_completed, attempts, hints_used) VALUES
(1, 'puzzle1', FALSE, 0, 0),
(1, 'puzzle2', FALSE, 0, 0),
(1, 'puzzle3', FALSE, 0, 0);

-- Test-Mission-Progress (falls nicht vorhanden)
INSERT IGNORE INTO mission_progress (user_id, mission_id, is_completed, puzzles_completed, rooms_visited) VALUES
(1, 'mission1_crypto_bank', FALSE, 0, 0);

-- Test-Inventory (falls nicht vorhanden)
INSERT IGNORE INTO player_inventory (user_id, item_id, quantity) VALUES
(1, 'laptop', 1),
(1, 'usb_stick', 2);

-- Überprüfung der Daten
SELECT 
    'Users' as table_name,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Game States' as table_name,
    COUNT(*) as count
FROM game_states
UNION ALL
SELECT 
    'Puzzle Progress' as table_name,
    COUNT(*) as count
FROM puzzle_progress
UNION ALL
SELECT 
    'Mission Progress' as table_name,
    COUNT(*) as count
FROM mission_progress
UNION ALL
SELECT 
    'Player Inventory' as table_name,
    COUNT(*) as count
FROM player_inventory;

-- Zeige Game-State für User 1
SELECT 
    user_id,
    current_room,
    current_mission,
    bitcoins,
    experience_points,
    level
FROM game_states 
WHERE user_id = 1;

-- Raum-Besuche-Tabelle für Tracking
CREATE TABLE IF NOT EXISTS room_visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id VARCHAR(100) NOT NULL,
    mission_id VARCHAR(100) NULL,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visit_duration_seconds INT DEFAULT 0, -- Optional: Aufenthaltsdauer
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_visited_at (visited_at)
);

-- Spieler-Statistiken erweitern (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS player_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzles_solved INT DEFAULT 0,
    rooms_visited INT DEFAULT 0,
    missions_completed INT DEFAULT 0,
    total_bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000,
    total_exp_earned INT DEFAULT 0,
    play_time_minutes INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_stats (user_id),
    INDEX idx_user_id (user_id)
);

-- Beispiel-Missionen einfügen
INSERT IGNORE INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) VALUES
('tutorial_mission', 'Tutorial Mission', 'Lerne die Grundlagen des Spiels', 1, 1, 0.00010000, 50),
('first_hack', 'Erster Hack', 'Dein erster richtiger Hack', 2, 1, 0.00050000, 100),
('network_infiltration', 'Netzwerk-Infiltration', 'Dringe in ein fremdes Netzwerk ein', 3, 2, 0.00100000, 200),
('data_heist', 'Data Heist', 'Stehle wertvolle Daten', 4, 3, 0.00200000, 400),
('final_mission', 'Finale Mission', 'Die ultimative Herausforderung', 5, 5, 0.00500000, 1000);

-- Beispiel-Räume einfügen (falls nicht vorhanden)
INSERT IGNORE INTO rooms (room_id, mission_id, name, description, is_locked, required_level) VALUES
('bedroom', 'tutorial_mission', 'Schlafzimmer', 'Dein Ausgangspunkt', FALSE, 1),
('living_room', 'tutorial_mission', 'Wohnzimmer', 'Der nächste Raum', FALSE, 1),
('kitchen', 'first_hack', 'Küche', 'Ein weiterer Raum', FALSE, 1),
('basement', 'network_infiltration', 'Keller', 'Versteckter Bereich', TRUE, 2),
('office', 'data_heist', 'Büro', 'Arbeitsbereich', TRUE, 3),
('server_room', 'final_mission', 'Server-Raum', 'Das finale Ziel', TRUE, 5);

-- Beispiel-Spieler-Status erstellen (für User ID 1)
INSERT IGNORE INTO game_states (user_id, current_room, current_mission, bitcoins, experience_points, level) VALUES
(1, 'bedroom', 'tutorial_mission', 0.00010000, 0, 1);

-- Beispiel-Spieler-Statistiken erstellen
INSERT IGNORE INTO player_stats (user_id, puzzles_solved, rooms_visited, missions_completed) VALUES
(1, 0, 1, 0);

-- Trigger für automatische Statistiken-Updates
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_puzzle_stats
AFTER INSERT ON puzzle_progress
FOR EACH ROW
BEGIN
    IF NEW.is_completed = TRUE THEN
        UPDATE player_stats 
        SET puzzles_solved = puzzles_solved + 1,
            total_exp_earned = total_exp_earned + (
                SELECT reward_exp FROM puzzles WHERE puzzle_id = NEW.puzzle_id
            ),
            total_bitcoins_earned = total_bitcoins_earned + (
                SELECT reward_bitcoins FROM puzzles WHERE puzzle_id = NEW.puzzle_id
            )
        WHERE user_id = NEW.user_id;
    END IF;
END//

CREATE TRIGGER IF NOT EXISTS update_mission_stats
AFTER UPDATE ON mission_progress
FOR EACH ROW
BEGIN
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
        UPDATE player_stats 
        SET missions_completed = missions_completed + 1,
            total_exp_earned = total_exp_earned + (
                SELECT reward_exp FROM missions WHERE mission_id = NEW.mission_id
            ),
            total_bitcoins_earned = total_bitcoins_earned + (
                SELECT reward_bitcoins FROM missions WHERE mission_id = NEW.mission_id
            )
        WHERE user_id = NEW.user_id;
    END IF;
END//

DELIMITER ;

-- Views für einfache Abfragen
CREATE OR REPLACE VIEW player_progress_overview AS
SELECT 
    u.username,
    gs.current_room,
    gs.current_mission,
    gs.bitcoins,
    gs.experience_points,
    gs.level,
    ps.puzzles_solved,
    ps.missions_completed,
    ps.rooms_visited,
    ps.total_bitcoins_earned,
    ps.total_exp_earned
FROM users u
LEFT JOIN game_states gs ON u.id = gs.user_id
LEFT JOIN player_stats ps ON u.id = ps.user_id;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_puzzle_progress_user_completed ON puzzle_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_mission_progress_user_completed ON mission_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_room_visits_user_room ON room_visits(user_id, room_id); 