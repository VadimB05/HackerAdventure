-- INTRUSION Database Schema
-- MariaDB/MySQL kompatibel

-- Datenbank erstellen
CREATE DATABASE IF NOT EXISTS intrusion_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE intrusion_db;

-- Benutzer-Tabelle
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Spielstände-Tabelle
CREATE TABLE game_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_room VARCHAR(100) NOT NULL DEFAULT 'intro',
    inventory JSON DEFAULT '[]',
    progress JSON DEFAULT '{}',
    money DECIMAL(10,2) DEFAULT 0.00,
    experience_points INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_current_room (current_room)
);

-- Räume/Missionen-Tabelle
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    background_image VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    required_level INT DEFAULT 1,
    required_items JSON DEFAULT '[]',
    connections JSON DEFAULT '{}', -- Verbindungen zu anderen Räumen
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_id (room_id),
    INDEX idx_is_locked (is_locked)
);

-- Rätsel-Tabelle
CREATE TABLE puzzles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puzzle_id VARCHAR(100) UNIQUE NOT NULL,
    room_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    puzzle_type ENUM('terminal', 'point_and_click', 'logic', 'password') NOT NULL,
    difficulty INT DEFAULT 1, -- 1-5
    solution JSON NOT NULL, -- Verschiedene Lösungswege
    hints JSON DEFAULT '[]',
    reward_money DECIMAL(10,2) DEFAULT 0.00,
    reward_exp INT DEFAULT 0,
    reward_items JSON DEFAULT '[]',
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_room_id (room_id),
    INDEX idx_puzzle_type (puzzle_type)
);

-- Spieler-Fortschritt bei Rätseln
CREATE TABLE puzzle_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzle_id VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_puzzle (user_id, puzzle_id),
    INDEX idx_user_id (user_id),
    INDEX idx_puzzle_id (puzzle_id)
);

-- Items/Inventar-Tabelle
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type ENUM('tool', 'key', 'document', 'consumable', 'equipment') NOT NULL,
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
    value DECIMAL(10,2) DEFAULT 0.00,
    is_tradeable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item_id (item_id),
    INDEX idx_item_type (item_type),
    INDEX idx_rarity (rarity)
);

-- Spieler-Inventar
CREATE TABLE player_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_item (user_id, item_id),
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id)
);

-- Spieler-Statistiken
CREATE TABLE player_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzles_solved INT DEFAULT 0,
    rooms_visited INT DEFAULT 0,
    total_money_earned DECIMAL(10,2) DEFAULT 0.00,
    total_exp_earned INT DEFAULT 0,
    play_time_minutes INT DEFAULT 0,
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
    required_puzzles_solved INT DEFAULT 0,
    required_money_earned DECIMAL(10,2) DEFAULT 0.00,
    required_exp_earned INT DEFAULT 0,
    reward_money DECIMAL(10,2) DEFAULT 0.00,
    reward_exp INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_achievement_id (achievement_id)
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
    money_earned DECIMAL(10,2) DEFAULT 0.00,
    exp_earned INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_start (session_start)
);

-- Standard-Daten einfügen

-- Standard-Räume
INSERT INTO rooms (room_id, name, description, is_locked, required_level) VALUES
('intro', 'Einführung', 'Willkommen in der Welt des ethischen Hackings', FALSE, 1),
('basement', 'Keller', 'Ein dunkler Keller mit alten Computern', FALSE, 1),
('city_view', 'Stadtansicht', 'Überblick über die digitale Stadt', TRUE, 2),
('darknet_chat', 'Darknet Chat', 'Versteckte Kommunikation im Darknet', TRUE, 3),
('darkroom_chat', 'Darkroom Chat', 'Geheime Gespräche im Darkroom', TRUE, 4);

-- Standard-Items
INSERT INTO items (item_id, name, description, item_type, rarity, value) VALUES
('laptop', 'Laptop', 'Ein alter aber funktionsfähiger Laptop', 'tool', 'common', 100.00),
('usb_stick', 'USB-Stick', 'Ein USB-Stick mit unbekanntem Inhalt', 'tool', 'uncommon', 50.00),
('keycard', 'Zugangskarte', 'Eine magnetische Zugangskarte', 'key', 'rare', 200.00),
('hacking_manual', 'Hacking-Handbuch', 'Ein detailliertes Handbuch für ethisches Hacking', 'document', 'uncommon', 75.00);

-- Standard-Achievements
INSERT INTO achievements (achievement_id, name, description, required_puzzles_solved, reward_exp) VALUES
('first_puzzle', 'Erstes Rätsel', 'Löse dein erstes Rätsel', 1, 50),
('puzzle_master', 'Rätsel-Meister', 'Löse 10 Rätsel', 10, 500),
('wealthy_hacker', 'Reicher Hacker', 'Verdiene 1000€', 0, 200);

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
            total_money_earned = total_money_earned + (
                SELECT reward_money FROM puzzles WHERE puzzle_id = NEW.puzzle_id
            )
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
    gs.money,
    gs.experience_points,
    gs.level,
    ps.puzzles_solved,
    ps.rooms_visited,
    ps.total_money_earned,
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
    p.reward_money,
    p.reward_exp,
    p.is_required
FROM puzzles p
JOIN rooms r ON p.room_id = r.room_id
ORDER BY r.required_level, p.difficulty; 