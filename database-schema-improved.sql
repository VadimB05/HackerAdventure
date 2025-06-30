-- INTRUSION Database Schema - Verbesserte Version
-- MariaDB/MySQL kompatibel

-- Datenbank erstellen
CREATE DATABASE IF NOT EXISTS intrusion_game 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE intrusion_game;

-- Benutzer-Tabelle
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_is_active (is_active)
);

-- Missionen-Tabelle (neue Hierarchie-Ebene)
CREATE TABLE missions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mission_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty INT DEFAULT 1, -- 1-5
    required_level INT DEFAULT 1,
    reward_bitcoins DECIMAL(10,8) DEFAULT 0.00000000,
    reward_exp INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mission_id (mission_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_required_level (required_level)
);

-- Räume-Tabelle (erweitert)
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(100) UNIQUE NOT NULL,
    mission_id VARCHAR(100) NULL, -- Optional: Raum kann zu Mission gehören
    name VARCHAR(255) NOT NULL,
    description TEXT,
    background_image VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    required_level INT DEFAULT 1,
    required_items JSON DEFAULT '[]',
    required_puzzles JSON DEFAULT '[]', -- Rätsel, die gelöst werden müssen
    connections JSON DEFAULT '{}', -- Verbindungen zu anderen Räumen
    ambient_sound VARCHAR(255), -- Optional: Hintergrundgeräusche
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE SET NULL,
    INDEX idx_room_id (room_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_is_locked (is_locked),
    INDEX idx_required_level (required_level)
);

-- Rätsel-Tabelle (erweitert)
CREATE TABLE puzzles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puzzle_id VARCHAR(100) UNIQUE NOT NULL,
    room_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    puzzle_type ENUM('terminal', 'point_and_click', 'logic', 'password', 'sequence', 'pattern', 'multiple_choice', 'code', 'terminal_command') NOT NULL,
    difficulty INT DEFAULT 1, -- 1-5
    solution JSON NOT NULL, -- Verschiedene Lösungswege
    hints JSON DEFAULT '[]',
    max_attempts INT DEFAULT 3, -- Maximale Versuche
    time_limit_seconds INT NULL, -- Optional: Zeitlimit
    reward_bitcoins DECIMAL(10,8) DEFAULT 0.00000000,
    reward_exp INT DEFAULT 0,
    reward_items JSON DEFAULT '[]',
    is_required BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE, -- Versteckte Rätsel
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_room_id (room_id),
    INDEX idx_puzzle_type (puzzle_type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_is_required (is_required)
);

-- Rätsel-spezifische Daten (für verschiedene Rätseltypen)
CREATE TABLE puzzle_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puzzle_id VARCHAR(100) NOT NULL,
    data_type ENUM('multiple_choice', 'code', 'terminal', 'password', 'sequence', 'pattern') NOT NULL,
    data_key VARCHAR(100) NOT NULL, -- z.B. 'question', 'options', 'correct_answer', 'allowed_commands'
    data_value JSON NOT NULL, -- Speichert die spezifischen Daten je nach Typ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE CASCADE,
    UNIQUE KEY unique_puzzle_data_key (puzzle_id, data_type, data_key),
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_data_type (data_type)
);

-- Spielstände-Tabelle (erweitert)
CREATE TABLE game_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_room VARCHAR(100) NOT NULL DEFAULT 'intro',
    current_mission VARCHAR(100) NULL,
    inventory JSON DEFAULT '[]',
    progress JSON DEFAULT '{}', -- Fortschritt pro Raum/Mission
    bitcoins DECIMAL(10,8) DEFAULT 0.00000000,
    experience_points INT DEFAULT 0,
    level INT DEFAULT 1,
    health INT DEFAULT 100, -- Optional: Gesundheitssystem
    energy INT DEFAULT 100, -- Optional: Energiesystem
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_room) REFERENCES rooms(room_id) ON DELETE RESTRICT,
    FOREIGN KEY (current_mission) REFERENCES missions(mission_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_current_room (current_room),
    INDEX idx_current_mission (current_mission)
);

-- Spieler-Fortschritt bei Rätseln (erweitert)
CREATE TABLE puzzle_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzle_id VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    best_time_seconds INT NULL, -- Beste Zeit für Zeitlimit-Rätsel
    completed_at TIMESTAMP NULL,
    hints_used INT DEFAULT 0, -- Anzahl verwendeter Hinweise
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_puzzle (user_id, puzzle_id),
    INDEX idx_user_id (user_id),
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_is_completed (is_completed)
);

-- Spieler-Fortschritt bei Missionen
CREATE TABLE mission_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mission_id VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    puzzles_completed INT DEFAULT 0, -- Anzahl gelöster Rätsel in dieser Mission
    rooms_visited INT DEFAULT 0, -- Anzahl besuchter Räume in dieser Mission
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_mission (user_id, mission_id),
    INDEX idx_user_id (user_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_is_completed (is_completed)
);

-- Speicherpunkte für automatisches und manuelles Speichern
CREATE TABLE save_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    save_id VARCHAR(36) UNIQUE NOT NULL, -- UUID für den Speicherpunkt
    user_id INT NOT NULL,
    event_type ENUM('puzzle_solved', 'mission_completed', 'room_entered', 'item_collected', 'manual_save', 'game_started') NOT NULL,
    event_data JSON DEFAULT '{}', -- Zusätzliche Event-Daten
    game_state_snapshot JSON NOT NULL, -- Vollständiger Spielstand-Snapshot
    is_auto_save BOOLEAN DEFAULT FALSE, -- Unterscheidung zwischen Auto- und Manuellspeicherung
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    INDEX idx_is_auto_save (is_auto_save)
);

-- Items/Inventar-Tabelle (erweitert)
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type ENUM('tool', 'key', 'document', 'consumable', 'equipment', 'weapon', 'armor') NOT NULL,
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
    value DECIMAL(10,8) DEFAULT 0.00000000,
    is_tradeable BOOLEAN DEFAULT TRUE,
    is_stackable BOOLEAN DEFAULT FALSE, -- Stapelbare Items
    max_stack_size INT DEFAULT 1, -- Maximale Stapelgröße
    durability INT NULL, -- Optional: Haltbarkeit
    effects JSON DEFAULT '[]', -- Spezialeffekte
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item_id (item_id),
    INDEX idx_item_type (item_type),
    INDEX idx_rarity (rarity),
    INDEX idx_is_tradeable (is_tradeable)
);

-- Spieler-Inventar (erweitert)
CREATE TABLE player_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    durability INT NULL, -- Aktuelle Haltbarkeit
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_item (user_id, item_id),
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id)
);

-- Spieler-Statistiken (erweitert)
CREATE TABLE player_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzles_solved INT DEFAULT 0,
    rooms_visited INT DEFAULT 0,
    missions_completed INT DEFAULT 0,
    total_bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000,
    total_exp_earned INT DEFAULT 0,
    play_time_minutes INT DEFAULT 0,
    total_attempts INT DEFAULT 0, -- Gesamte Versuche
    hints_used_total INT DEFAULT 0, -- Gesamte verwendete Hinweise
    current_alarm_level INT DEFAULT 0, -- Aktuelles Alarm-Level (0-10)
    max_alarm_level_reached INT DEFAULT 0, -- Höchstes erreichtes Alarm-Level
    total_alarm_increases INT DEFAULT 0, -- Gesamte Alarm-Level-Erhöhungen
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_stats (user_id),
    INDEX idx_user_id (user_id)
);

-- Spieler-Achievements
CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    achievement_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    category ENUM('puzzle', 'exploration', 'collection', 'speed', 'mastery') DEFAULT 'puzzle',
    required_puzzles_solved INT DEFAULT 0,
    required_rooms_visited INT DEFAULT 0,
    required_missions_completed INT DEFAULT 0,
    required_bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000,
    required_exp_earned INT DEFAULT 0,
    reward_bitcoins DECIMAL(10,8) DEFAULT 0.00000000,
    reward_exp INT DEFAULT 0,
    reward_items JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_achievement_id (achievement_id),
    INDEX idx_category (category)
);

-- Spieler-Achievements (Verknüpfungstabelle)
CREATE TABLE player_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_achievement_id (achievement_id)
);

-- Spieler-Sessions (für Analytics)
CREATE TABLE player_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    duration_minutes INT DEFAULT 0,
    puzzles_attempted INT DEFAULT 0,
    puzzles_completed INT DEFAULT 0,
    rooms_visited INT DEFAULT 0,
    bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000,
    exp_earned INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_start (session_start)
);

-- Zuordnungstabelle: Items in Räumen
CREATE TABLE room_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(100) NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    INDEX idx_room_id (room_id),
    INDEX idx_item_id (item_id)
);

-- Alarm-Level-Historie
CREATE TABLE alarm_level_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alarm_level INT NOT NULL, -- Neues Alarm-Level (1-10)
    reason VARCHAR(255) NOT NULL, -- Grund für die Erhöhung
    puzzle_id VARCHAR(100) NULL, -- Optional: Welches Rätsel
    mission_id VARCHAR(100) NULL, -- Optional: Welche Mission
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE SET NULL,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_alarm_level (alarm_level),
    INDEX idx_created_at (created_at)
);

-- Standard-Daten einfügen

-- Standard-Missionen
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) VALUES
('tutorial', 'Tutorial Mission', 'Lerne die Grundlagen des ethischen Hackings', 1, 1, 0.00100000, 50),
('basement_investigation', 'Keller-Untersuchung', 'Untersuche die mysteriösen Computer im Keller', 2, 2, 0.00250000, 100),
('city_network', 'Stadtnetzwerk', 'Hacke dich ins städtische Netzwerk', 3, 3, 0.00500000, 200),
('darknet_operation', 'Darknet-Operation', 'Tauche ein in die Tiefen des Darknets', 4, 4, 0.01000000, 400);

-- Standard-Räume
INSERT INTO rooms (room_id, mission_id, name, description, is_locked, required_level) VALUES
('intro', 'tutorial', 'Einführung', 'Willkommen in der Welt des ethischen Hackings', FALSE, 1),
('basement', 'basement_investigation', 'Keller', 'Ein dunkler Keller mit alten Computern', FALSE, 1),
('city_view', 'city_network', 'Stadtansicht', 'Überblick über die digitale Stadt', TRUE, 2),
('darknet_chat', 'darknet_operation', 'Darknet Chat', 'Versteckte Kommunikation im Darknet', TRUE, 3),
('darkroom_chat', 'darknet_operation', 'Darkroom Chat', 'Geheime Gespräche im Darkroom', TRUE, 4);

-- Standard-Items
INSERT INTO items (item_id, name, description, item_type, rarity, value, is_stackable, max_stack_size) VALUES
('laptop', 'Laptop', 'Ein alter aber funktionsfähiger Laptop', 'tool', 'common', 0.00100000, FALSE, 1),
('usb_stick', 'USB-Stick', 'Ein USB-Stick mit unbekanntem Inhalt', 'tool', 'uncommon', 0.00050000, TRUE, 10),
('keycard', 'Zugangskarte', 'Eine magnetische Zugangskarte', 'key', 'rare', 0.00200000, FALSE, 1),
('hacking_manual', 'Hacking-Handbuch', 'Ein detailliertes Handbuch für ethisches Hacking', 'document', 'uncommon', 0.00075000, FALSE, 1),
('energy_drink', 'Energy Drink', 'Gibt dir Energie für längere Hacking-Sessions', 'consumable', 'common', 0.00005000, TRUE, 20);

-- Standard-Achievements
INSERT INTO achievements (achievement_id, name, description, category, required_puzzles_solved, reward_exp) VALUES
('first_puzzle', 'Erstes Rätsel', 'Löse dein erstes Rätsel', 'puzzle', 1, 50),
('puzzle_master', 'Rätsel-Meister', 'Löse 10 Rätsel', 'puzzle', 10, 500),
('explorer', 'Entdecker', 'Besuche 5 verschiedene Räume', 'exploration', 0, 200),
('wealthy_hacker', 'Reicher Hacker', 'Verdiene 1000€', 'collection', 0, 200);

-- Trigger für automatische Statistiken-Updates
DELIMITER //

CREATE TRIGGER after_puzzle_complete
AFTER UPDATE ON puzzle_progress
FOR EACH ROW
BEGIN
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
        UPDATE player_stats 
        SET puzzles_solved = puzzles_solved + 1,
            total_exp_earned = total_exp_earned + (
                SELECT reward_exp FROM puzzles WHERE puzzle_id = NEW.puzzle_id
            ),
            total_bitcoins_earned = total_bitcoins_earned + (
                SELECT reward_bitcoins FROM puzzles WHERE puzzle_id = NEW.puzzle_id
            ),
            hints_used_total = hints_used_total + NEW.hints_used
        WHERE user_id = NEW.user_id;
    END IF;
END//

DELIMITER ;

-- Views für einfachere Abfragen

-- Spieler-Übersicht
CREATE VIEW player_overview AS
SELECT 
    u.id,
    u.username,
    u.created_at,
    gs.current_room,
    gs.current_mission,
    gs.bitcoins,
    gs.experience_points,
    gs.level,
    ps.puzzles_solved,
    ps.rooms_visited,
    ps.missions_completed,
    ps.total_bitcoins_earned,
    ps.total_exp_earned
FROM users u
LEFT JOIN game_states gs ON u.id = gs.user_id
LEFT JOIN player_stats ps ON u.id = ps.user_id
WHERE u.is_active = TRUE;

-- Rätsel-Übersicht
CREATE VIEW puzzle_overview AS
SELECT 
    p.puzzle_id,
    p.name,
    p.puzzle_type,
    p.difficulty,
    r.name as room_name,
    m.name as mission_name,
    p.reward_bitcoins,
    p.reward_exp,
    p.is_required,
    p.is_hidden
FROM puzzles p
JOIN rooms r ON p.room_id = r.room_id
LEFT JOIN missions m ON r.mission_id = m.mission_id
ORDER BY m.required_level, r.required_level, p.difficulty;

-- Mission-Übersicht
CREATE VIEW mission_overview AS
SELECT 
    m.mission_id,
    m.name,
    m.difficulty,
    m.required_level,
    m.reward_bitcoins,
    m.reward_exp,
    COUNT(r.id) as room_count,
    COUNT(p.id) as puzzle_count
FROM missions m
LEFT JOIN rooms r ON m.mission_id = r.mission_id
LEFT JOIN puzzles p ON r.room_id = p.room_id
GROUP BY m.mission_id, m.name, m.difficulty, m.required_level, m.reward_bitcoins, m.reward_exp
ORDER BY m.required_level, m.difficulty; 