-- INTRUSION - Komplettes Datenbank-Setup
-- Erstellt alle Tabellen und die erste Mission basierend auf database-schema-improved.sql

CREATE DATABASE IF NOT EXISTS intrusion_game 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE intrusion_game;

-- ========================================
-- TABELLEN ERSTELLEN
-- ========================================

-- Benutzer-Tabelle
CREATE TABLE IF NOT EXISTS users (
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

-- Missionen-Tabelle
CREATE TABLE IF NOT EXISTS missions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mission_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty INT DEFAULT 1,
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

-- Räume-Tabelle
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(100) UNIQUE NOT NULL,
    mission_id VARCHAR(100) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    background_image VARCHAR(255),
    is_locked BOOLEAN DEFAULT FALSE,
    required_level INT DEFAULT 1,
    required_items JSON DEFAULT '[]',
    required_puzzles JSON DEFAULT '[]',
    connections JSON DEFAULT '{}',
    ambient_sound VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE SET NULL,
    INDEX idx_room_id (room_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_is_locked (is_locked),
    INDEX idx_required_level (required_level)
);

-- Rätsel-Tabelle
CREATE TABLE IF NOT EXISTS puzzles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puzzle_id VARCHAR(100) UNIQUE NOT NULL,
    room_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    puzzle_type ENUM('terminal', 'point_and_click', 'logic', 'password', 'sequence', 'pattern', 'multiple_choice', 'code', 'terminal_command') NOT NULL,
    difficulty INT DEFAULT 1,
    solution JSON NOT NULL,
    hints JSON DEFAULT '[]',
    max_attempts INT DEFAULT 3,
    time_limit_seconds INT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_room_id (room_id),
    INDEX idx_puzzle_type (puzzle_type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_is_required (is_required)
);

-- Rätsel-spezifische Daten
CREATE TABLE IF NOT EXISTS puzzle_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puzzle_id VARCHAR(100) NOT NULL,
    data_type ENUM('multiple_choice', 'code', 'terminal', 'password', 'sequence', 'pattern') NOT NULL,
    data_key VARCHAR(100) NOT NULL,
    data_value JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE CASCADE,
    UNIQUE KEY unique_puzzle_data_key (puzzle_id, data_type, data_key),
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_data_type (data_type)
);

-- Spielstände-Tabelle
CREATE TABLE IF NOT EXISTS game_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_room VARCHAR(100) NOT NULL DEFAULT 'intro',
    current_mission VARCHAR(100) NULL,
    inventory JSON DEFAULT '[]',
    progress JSON DEFAULT '{}',
    bitcoins DECIMAL(10,8) DEFAULT 0.00000000,
    experience_points INT DEFAULT 0,
    level INT DEFAULT 1,
    health INT DEFAULT 100,
    energy INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_room) REFERENCES rooms(room_id) ON DELETE RESTRICT,
    FOREIGN KEY (current_mission) REFERENCES missions(mission_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_current_room (current_room),
    INDEX idx_current_mission (current_mission)
);

-- Spieler-Fortschritt bei Rätseln
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_puzzle (user_id, puzzle_id),
    INDEX idx_user_id (user_id),
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_is_completed (is_completed)
);

-- Spieler-Fortschritt bei Missionen
CREATE TABLE IF NOT EXISTS mission_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mission_id VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    puzzles_completed INT DEFAULT 0,
    rooms_visited INT DEFAULT 0,
    rewards_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_mission (user_id, mission_id),
    INDEX idx_user_id (user_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_is_completed (is_completed),
    INDEX idx_rewards_claimed (rewards_claimed)
);

-- Items/Inventar-Tabelle
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type ENUM('tool', 'key', 'document', 'consumable', 'equipment', 'weapon', 'armor') NOT NULL,
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
    value DECIMAL(10,8) DEFAULT 0.00000000,
    is_tradeable BOOLEAN DEFAULT TRUE,
    is_stackable BOOLEAN DEFAULT FALSE,
    max_stack_size INT DEFAULT 1,
    durability INT NULL,
    effects JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item_id (item_id),
    INDEX idx_item_type (item_type),
    INDEX idx_rarity (rarity),
    INDEX idx_is_tradeable (is_tradeable)
);

-- Spieler-Inventar
CREATE TABLE IF NOT EXISTS player_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    durability INT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_item (user_id, item_id),
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id)
);

-- Spieler-Statistiken
CREATE TABLE IF NOT EXISTS player_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzles_solved INT DEFAULT 0,
    rooms_visited INT DEFAULT 0,
    missions_completed INT DEFAULT 0,
    total_bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000,
    total_exp_earned INT DEFAULT 0,
    play_time_minutes INT DEFAULT 0,
    total_attempts INT DEFAULT 0,
    hints_used_total INT DEFAULT 0,
    current_alarm_level INT DEFAULT 0,
    max_alarm_level_reached INT DEFAULT 0,
    total_alarm_increases INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_stats (user_id),
    INDEX idx_user_id (user_id)
);

-- Alarm-Level-Historie
CREATE TABLE IF NOT EXISTS alarm_level_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alarm_level INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    puzzle_id VARCHAR(100) NULL,
    mission_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE SET NULL,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_alarm_level (alarm_level),
    INDEX idx_created_at (created_at)
);

-- Speicherpunkte für automatisches und manuelles Speichern
CREATE TABLE IF NOT EXISTS save_points (
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

-- Zuordnungstabelle: Items in Räumen
CREATE TABLE IF NOT EXISTS room_items (
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

-- ========================================
-- ERSTE MISSION ERSTELLEN
-- ========================================

-- Mission 1: Crypto Bank Mission
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission1_crypto_bank', 'Crypto Bank Mission', 'Hacke dich in die Crypto-Bank ein und finde das Passwort', 1, 1, 0.00100000, 100)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Räume für Crypto Bank Mission
INSERT INTO rooms (room_id, mission_id, name, description, background_image, is_locked, required_level, connections) VALUES
('intro', 'mission1_crypto_bank', 'Einführung', 'Willkommen in der Welt des ethischen Hackings. Hier beginnt deine Reise als angehender Hacker.', 'room-bedroom.png', false, 1, '{"city1-room": {"id": "city1-room", "name": "Stadtansicht", "description": "Hochhäuser und digitale Stadtlandschaft"}}')
ON DUPLICATE KEY UPDATE 
    mission_id = VALUES(mission_id),
    name = VALUES(name),
    description = VALUES(description),
    background_image = VALUES(background_image),
    is_locked = VALUES(is_locked),
    required_level = VALUES(required_level),
    connections = VALUES(connections);

-- ========================================
-- RÄTSEL FÜR CRYPTO BANK MISSION
-- ========================================

-- Rätsel 1: Multiple Choice - Bank-Sicherheit
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, is_required) VALUES
('puzzle_mc_bank_security', 'intro', 'Bank-Sicherheit', 'Welche Art von Verschlüsselung wird am häufigsten für Online-Banking verwendet?', 'multiple_choice', 1, 
'["SSL/TLS"]', 
'["Tipp: Es ist ein Protokoll für sichere Verbindungen", "Tipp: HTTPS verwendet es"]', 
3, TRUE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    puzzle_type = VALUES(puzzle_type),
    difficulty = VALUES(difficulty),
    solution = VALUES(solution),
    hints = VALUES(hints),
    max_attempts = VALUES(max_attempts),
    is_required = VALUES(is_required);

-- Multiple Choice Daten für Bank-Sicherheit
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('puzzle_mc_bank_security', 'multiple_choice', 'question', '"Welche Art von Verschlüsselung wird am häufigsten für Online-Banking verwendet?"'),
('puzzle_mc_bank_security', 'multiple_choice', 'options', '["SSL/TLS", "MD5", "DES", "ROT13"]'),
('puzzle_mc_bank_security', 'multiple_choice', 'correct_answer', '"SSL/TLS"'),
('puzzle_mc_bank_security', 'multiple_choice', 'explanation', '"SSL/TLS ist das Standardprotokoll für sichere Web-Verbindungen und wird von allen Banken verwendet."')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

-- Rätsel 2: Code-Rätsel - Bank-Passwort knacken
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, is_required) VALUES
('puzzle_code_bank_password', 'intro', 'Bank-Passwort knacken', 'Das Bank-System verwendet SHA-256. Berechne den Hash von "bank123".', 'code', 2, 
'["0595d0fa0f6b716e4f3e4989f915f874b2851de2feb32c43e5b5aa6ee15409b6"]', 
'["Tipp: SHA-256 von bank123", "Tipp: Verwende einen Online-SHA-256-Generator"]', 
5, TRUE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    puzzle_type = VALUES(puzzle_type),
    difficulty = VALUES(difficulty),
    solution = VALUES(solution),
    hints = VALUES(hints),
    max_attempts = VALUES(max_attempts),
    is_required = VALUES(is_required);

-- Code-Rätsel Daten für Bank-Passwort
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('puzzle_code_bank_password', 'code', 'code_snippet', '"// Bank-System Login\\n// Passwort-Hash: 0595d0fa0f6b716e4f3e4989f915f874b2851de2feb32c43e5b5aa6ee15409b6\\n// Finde das ursprüngliche Passwort\\nfunction verifyPassword(input) {\\n    const hash = sha256(input);\\n    return hash === \\"0595d0fa0f6b716e4f3e4989f915f874b2851de2feb32c43e5b5aa6ee15409b6\\";\\n}"'),
('puzzle_code_bank_password', 'code', 'expected_input', '"0595d0fa0f6b716e4f3e4989f915f874b2851de2feb32c43e5b5aa6ee15409b6"'),
('puzzle_code_bank_password', 'code', 'case_sensitive', 'false'),
('puzzle_code_bank_password', 'code', 'allow_partial', 'false'),
('puzzle_code_bank_password', 'code', 'language', '"javascript"')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

-- Rätsel 3: Terminal-Rätsel - Bank-System erkunden
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, is_required) VALUES
('puzzle_terminal_bank_scan', 'intro', 'Bank-System scannen', 'Scanne das Bank-Netzwerk nach offenen Ports. Verwende nmap für Port 22 (SSH).', 'terminal_command', 1, 
'["nmap -p 22 192.168.1.100"]', 
'["Tipp: nmap für Port 22", "Tipp: Die IP ist 192.168.1.100"]', 
3, TRUE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    puzzle_type = VALUES(puzzle_type),
    difficulty = VALUES(difficulty),
    solution = VALUES(solution),
    hints = VALUES(hints),
    max_attempts = VALUES(max_attempts),
    is_required = VALUES(is_required);

-- Terminal Command Daten für Bank-Scan
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('puzzle_terminal_bank_scan', 'terminal', 'allowed_commands', '["nmap -p 22 192.168.1.100", "nmap 192.168.1.100", "nmap -p 22,80,443 192.168.1.100"]'),
('puzzle_terminal_bank_scan', 'terminal', 'expected_output', '"Starting Nmap 7.80\\nNmap scan report for 192.168.1.100\\nPORT   STATE SERVICE\\n22/tcp open  ssh\\nNmap done: 1 IP address (1 host up) scanned in 0.05 seconds"'),
('puzzle_terminal_bank_scan', 'terminal', 'command', '"nmap -p 22 192.168.1.100"'),
('puzzle_terminal_bank_scan', 'terminal', 'working_directory', '"/home/hacker"'),
('puzzle_terminal_bank_scan', 'terminal', 'file_system', '{"nmap": "nmap executable", "tools": "directory"}')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

-- ========================================
-- ITEMS ERSTELLEN
-- ========================================

-- Standard-Items
INSERT INTO items (item_id, name, description, item_type, rarity, value, is_stackable, max_stack_size) VALUES
('laptop', 'Laptop', 'Ein alter aber funktionsfähiger Laptop', 'tool', 'common', 0.00100000, FALSE, 1),
('usb_stick', 'USB-Stick', 'Ein USB-Stick mit unbekanntem Inhalt', 'tool', 'uncommon', 0.00050000, TRUE, 10),
('keycard', 'Zugangskarte', 'Eine magnetische Zugangskarte', 'key', 'rare', 0.00200000, FALSE, 1),
('hacking_manual', 'Hacking-Handbuch', 'Ein detailliertes Handbuch für ethisches Hacking', 'document', 'uncommon', 0.00075000, FALSE, 1),
('energy_drink', 'Energy Drink', 'Gibt dir Energie für längere Hacking-Sessions', 'consumable', 'common', 0.00005000, TRUE, 20)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    item_type = VALUES(item_type),
    rarity = VALUES(rarity),
    value = VALUES(value),
    is_stackable = VALUES(is_stackable),
    max_stack_size = VALUES(max_stack_size);

-- Items in Räume platzieren
INSERT INTO room_items (room_id, item_id, quantity) VALUES
('intro', 'laptop', 1),
('intro', 'usb_stick', 1),
('intro', 'hacking_manual', 1),
('intro', 'keycard', 1)
ON DUPLICATE KEY UPDATE 
    quantity = VALUES(quantity);

-- ========================================
-- TEST-USER ERSTELLEN
-- ========================================

-- Test-User
INSERT INTO users (id, username, password_hash, email, is_admin) VALUES
(1, 'testuser', '$2b$10$test', 'test@example.com', FALSE)
ON DUPLICATE KEY UPDATE 
    username = VALUES(username),
    password_hash = VALUES(password_hash),
    email = VALUES(email),
    is_admin = VALUES(is_admin);

-- Test-Spieler-Status
INSERT INTO game_states (user_id, current_room, current_mission, bitcoins, experience_points, level) VALUES
(1, 'intro', 'mission1_crypto_bank', 0.00100000, 0, 1)
ON DUPLICATE KEY UPDATE 
    current_room = VALUES(current_room),
    current_mission = VALUES(current_mission),
    bitcoins = VALUES(bitcoins),
    experience_points = VALUES(experience_points),
    level = VALUES(level);

-- Test-Spieler-Statistiken
INSERT INTO player_stats (user_id, puzzles_solved, rooms_visited, missions_completed) VALUES
(1, 0, 1, 0)
ON DUPLICATE KEY UPDATE 
    puzzles_solved = VALUES(puzzles_solved),
    rooms_visited = VALUES(rooms_visited),
    missions_completed = VALUES(missions_completed);

-- Test-Mission-Progress
INSERT INTO mission_progress (user_id, mission_id, is_completed, puzzles_completed, rooms_visited) VALUES
(1, 'mission1_crypto_bank', FALSE, 0, 1)
ON DUPLICATE KEY UPDATE 
    is_completed = VALUES(is_completed),
    puzzles_completed = VALUES(puzzles_completed),
    rooms_visited = VALUES(rooms_visited);

-- Test-Puzzle-Progress
INSERT INTO puzzle_progress (user_id, puzzle_id, is_completed, attempts, hints_used) VALUES
(1, 'puzzle_mc_bank_security', FALSE, 0, 0),
(1, 'puzzle_code_bank_password', FALSE, 0, 0),
(1, 'puzzle_terminal_bank_scan', FALSE, 0, 0)
ON DUPLICATE KEY UPDATE 
    is_completed = VALUES(is_completed),
    attempts = VALUES(attempts),
    hints_used = VALUES(hints_used);

-- ========================================
-- VIEWS ERSTELLEN
-- ========================================

-- Spieler-Übersicht
CREATE OR REPLACE VIEW player_overview AS
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
CREATE OR REPLACE VIEW puzzle_overview AS
SELECT 
    p.puzzle_id,
    p.name,
    p.puzzle_type,
    p.difficulty,
    r.name as room_name,
    m.name as mission_name,
    p.is_required,
    p.is_hidden
FROM puzzles p
JOIN rooms r ON p.room_id = r.room_id
LEFT JOIN missions m ON r.mission_id = m.mission_id
ORDER BY m.required_level, r.required_level, p.difficulty;

-- ========================================
-- BESTÄTIGUNG
-- ========================================

SELECT 'Datenbank erfolgreich eingerichtet!' as status;

-- Überprüfung der Daten
SELECT 
    'Users' as table_name,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Missions' as table_name,
    COUNT(*) as count
FROM missions
UNION ALL
SELECT 
    'Rooms' as table_name,
    COUNT(*) as count
FROM rooms
UNION ALL
SELECT 
    'Puzzles' as table_name,
    COUNT(*) as count
FROM puzzles
UNION ALL
SELECT 
    'Items' as table_name,
    COUNT(*) as count
FROM items;

-- Zeige Crypto Bank Mission Details
SELECT 
    m.mission_id,
    m.name,
    m.description,
    m.difficulty,
    m.reward_bitcoins,
    m.reward_exp,
    COUNT(r.id) as room_count,
    COUNT(p.id) as puzzle_count
FROM missions m
LEFT JOIN rooms r ON m.mission_id = r.mission_id
LEFT JOIN puzzles p ON r.room_id = p.room_id
WHERE m.mission_id = 'mission1_crypto_bank'
GROUP BY m.mission_id, m.name, m.description, m.difficulty, m.reward_bitcoins, m.reward_exp; 