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

-- Städte-Tabelle (NEU)
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    required_level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city_id (city_id),
    INDEX idx_is_available (is_available),
    INDEX idx_required_level (required_level)
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

-- Stadt-Mission-Zuordnung (NEU)
CREATE TABLE IF NOT EXISTS city_missions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id VARCHAR(100) NOT NULL,
    mission_id VARCHAR(100) NOT NULL,
    building_number INT NOT NULL,  -- 1-5 für die 5 Gebäude
    building_name VARCHAR(255) NOT NULL,
    building_description TEXT,
    is_required BOOLEAN DEFAULT TRUE,  -- Muss abgeschlossen werden für city2
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE CASCADE,
    UNIQUE KEY unique_city_mission (city_id, mission_id),
    UNIQUE KEY unique_city_building (city_id, building_number),
    INDEX idx_city_id (city_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_building_number (building_number)
);

-- Räume-Tabelle (ERWEITERT um city_id)
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(100) UNIQUE NOT NULL,
    mission_id VARCHAR(100) NULL,
    city_id VARCHAR(100) NULL,  -- NEU: Verknüpfung zu Stadt
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
    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE SET NULL,  -- NEU
    INDEX idx_room_id (room_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_city_id (city_id),  -- NEU
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
    bitcoins DECIMAL(10,8) DEFAULT 0.00250000,
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
    event_type ENUM('puzzle_solved', 'mission_completed', 'room_entered', 'item_collected', 'manual_save', 'game_started', 'intro_modal_completed') NOT NULL,
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

-- Raum-Objekte (interaktive Objekte in Räumen)
CREATE TABLE IF NOT EXISTS room_objects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(100) NOT NULL,
    object_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    object_type ENUM('puzzle', 'exit', 'item', 'decoration') NOT NULL,
    x_position DECIMAL(5,2) NOT NULL,  -- Prozent-Position X
    y_position DECIMAL(5,2) NOT NULL,  -- Prozent-Position Y
    width DECIMAL(5,2) NOT NULL,       -- Prozent-Breite
    height DECIMAL(5,2) NOT NULL,      -- Prozent-Höhe
    icon VARCHAR(100),
    status ENUM('available', 'locked', 'hidden') DEFAULT 'available',
    compatible_items JSON DEFAULT '[]',
    required_items JSON DEFAULT '[]',
    required_missions_completed BOOLEAN DEFAULT FALSE,  -- NEU: Nur verfügbar wenn alle Missionen abgeschlossen
    puzzle_id VARCHAR(100) NULL,       -- Verknüpfung zu Rätsel
    exit_room_id VARCHAR(100) NULL,    -- Verknüpfung zu Ziel-Raum
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE SET NULL,
    UNIQUE KEY unique_room_object (room_id, object_id),
    INDEX idx_room_id (room_id),
    INDEX idx_object_type (object_type),
    INDEX idx_required_missions_completed (required_missions_completed)
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

-- Mission 2: Server Farm Mission (Building 1)
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission2_server_farm', 'Server Farm Mission', 'Hacke dich in die Server Farm ein und stehle wertvolle Daten von den Servern', 2, 2, 0.00200000, 200)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Mission 3: Tech Office Mission (Building 2)
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission3_office', 'Tech Office Mission', 'Hacke dich in das Tech Office ein und stehle vertrauliche Daten', 3, 3, 0.00300000, 300)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Mission 4: Research Lab Mission (Building 3)
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission4_lab', 'Research Lab Mission', 'Infiltriere das Forschungslabor und finde geheime Projekte', 4, 4, 0.00400000, 400)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Mission 5: Data Warehouse Mission (Building 4)
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission5_warehouse', 'Data Warehouse Mission', 'Durchsuche das Data Warehouse nach wertvollen Informationen', 5, 5, 0.00500000, 500)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Mission 6: Executive Penthouse Mission (Building 5)
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission6_penthouse', 'Executive Penthouse Mission', 'Hacke dich in die Luxus-Penthouse ein und finde geheime Dokumente', 6, 6, 0.00600000, 600)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- ========================================
-- CITY-SYSTEM ERSTELLEN
-- ========================================

-- Stadt 1: Cyberpunk City
INSERT INTO cities (city_id, name, description, is_available, required_level) VALUES
('city1', 'Cyberpunk City', 'Eine futuristische Stadt mit Hochhäusern und digitalen Anzeigen. Hier findest du verschiedene Missionen in den verschiedenen Gebäuden.', TRUE, 1)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    is_available = VALUES(is_available),
    required_level = VALUES(required_level);

-- Stadt 2: Downtown District (später verfügbar)
INSERT INTO cities (city_id, name, description, is_available, required_level) VALUES
('city2', 'Downtown District', 'Das Geschäftsviertel der Stadt mit noch höheren Gebäuden und komplexeren Missionen.', FALSE, 5)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    is_available = VALUES(is_available),
    required_level = VALUES(required_level);

-- Missionen für City 1 zuordnen
INSERT INTO city_missions (city_id, mission_id, building_number, building_name, building_description, is_required) VALUES
('city1', 'mission2_server_farm', 1, 'Server Farm Tower', 'Ein Hochhaus voller Server und Datenbanken. Hier kannst du wertvolle Daten von den Servern stehlen.', TRUE),
('city1', 'mission3_office', 2, 'Tech Office Building', 'Ein Bürogebäude einer Tech-Firma. Hier gibt es interessante Daten zu hacken.', TRUE),
('city1', 'mission4_lab', 3, 'Research Laboratory', 'Ein Forschungslabor mit geheimen Projekten. Vorsicht vor den Sicherheitssystemen.', TRUE),
('city1', 'mission5_warehouse', 4, 'Data Warehouse', 'Ein Lagerhaus voller Server und Daten. Perfekt für Datendiebstahl.', TRUE),
('city1', 'mission6_penthouse', 5, 'Executive Penthouse', 'Eine Luxus-Penthouse-Wohnung mit hochwertigen Sicherheitssystemen.', TRUE)
ON DUPLICATE KEY UPDATE 
    building_name = VALUES(building_name),
    building_description = VALUES(building_description),
    is_required = VALUES(is_required);

-- Räume für Crypto Bank Mission (intro bleibt unverändert)
INSERT INTO rooms (room_id, mission_id, name, description, background_image, is_locked, required_level, connections) VALUES
('intro', 'mission1_crypto_bank', 'Einführung', 'Willkommen in der Welt des ethischen Hackings. Hier beginnt deine Reise als angehender Hacker.', 'room-bedroom.png', false, 1, '{"city1": {"id": "city1", "name": "Cyberpunk City", "description": "Hochhäuser und digitale Stadtlandschaft"}}')
ON DUPLICATE KEY UPDATE 
    mission_id = VALUES(mission_id),
    name = VALUES(name),
    description = VALUES(description),
    background_image = VALUES(background_image),
    is_locked = VALUES(is_locked),
    required_level = VALUES(required_level),
    connections = VALUES(connections);

-- City 1 Hub-Raum (ohne Mission)
INSERT INTO rooms (room_id, city_id, name, description, background_image, is_locked, required_level, connections) VALUES
('city1', 'city1', 'Cyberpunk City', 'Eine futuristische Stadt mit Hochhäusern und digitalen Anzeigen. Hier findest du verschiedene Missionen in den verschiedenen Gebäuden.', 'city1-background.png', false, 1, '{"intro": {"id": "intro", "name": "Zuhause", "description": "Zurück zu deinem Zimmer"}, "city2": {"id": "city2", "name": "Downtown District", "description": "Weiter zur nächsten Stadt"}}')
ON DUPLICATE KEY UPDATE 
    city_id = VALUES(city_id),
    name = VALUES(name),
    description = VALUES(description),
    background_image = VALUES(background_image),
    is_locked = VALUES(is_locked),
    required_level = VALUES(required_level),
    connections = VALUES(connections);

-- Mission-Räume für die 5 Gebäude
INSERT INTO rooms (room_id, mission_id, city_id, name, description, background_image, is_locked, required_level, connections) VALUES
('building1_server_farm', 'mission2_server_farm', 'city1', 'Server Farm Lobby', 'Die Eingangshalle der Server Farm. Hier beginnt deine Mission.', 'building1-server-farm.png', false, 2, '{"city1": {"id": "city1", "name": "Zurück zur Stadt", "description": "Zurück zur Stadtansicht"}}'),
('building2_office', 'mission3_office', 'city1', 'Tech Office', 'Ein modernes Büro mit vielen Computern und Netzwerkgeräten.', 'building2-office.png', false, 3, '{"city1": {"id": "city1", "name": "Zurück zur Stadt", "description": "Zurück zur Stadtansicht"}}'),
('building3_lab', 'mission4_lab', 'city1', 'Research Lab', 'Ein Forschungslabor mit High-Tech-Ausrüstung und Sicherheitssystemen.', 'building3-lab.png', false, 4, '{"city1": {"id": "city1", "name": "Zurück zur Stadt", "description": "Zurück zur Stadtansicht"}}'),
('building4_warehouse', 'mission5_warehouse', 'city1', 'Data Warehouse', 'Ein großes Lagerhaus voller Server und Datenbanken.', 'building4-warehouse.png', false, 5, '{"city1": {"id": "city1", "name": "Zurück zur Stadt", "description": "Zurück zur Stadtansicht"}}'),
('building5_penthouse', 'mission6_penthouse', 'city1', 'Executive Penthouse', 'Eine luxuriöse Penthouse-Wohnung mit modernster Sicherheitstechnik.', 'building5-penthouse.png', false, 6, '{"city1": {"id": "city1", "name": "Zurück zur Stadt", "description": "Zurück zur Stadtansicht"}}')
ON DUPLICATE KEY UPDATE 
    mission_id = VALUES(mission_id),
    city_id = VALUES(city_id),
    name = VALUES(name),
    description = VALUES(description),
    background_image = VALUES(background_image),
    is_locked = VALUES(is_locked),
    required_level = VALUES(required_level),
    connections = VALUES(connections);

-- Raum-Objekte für den intro Raum
INSERT INTO room_objects (room_id, object_id, name, description, object_type, x_position, y_position, width, height, icon, exit_room_id, compatible_items, required_items, required_missions_completed) VALUES
('intro', 'computer', 'Computer', 'Mein Desktop-Computer. Hier kann ich hacken, Programme schreiben und Missionen starten.', 'puzzle', 12.0, 35.0, 20.0, 15.0, 'Zap', NULL, '["laptop", "usb_stick", "hacking_manual"]', '[]', FALSE),
('intro', 'window', 'Fenster', 'Ein abgedunkeltes Fenster. Hier kann ich die Außenwelt beobachten und Informationen sammeln.', 'puzzle', 47.5, 10.0, 25.0, 20.0, 'Eye', NULL, '["keycard", "hacking_manual"]', '[]', FALSE),
('intro', 'smartphone', 'Smartphone', 'Mein Smartphone. Hier kann ich Nachrichten empfangen, Apps nutzen und Kontakte verwalten.', 'puzzle', 30.0, 60.0, 12.0, 8.0, 'Package', NULL, '["usb_stick", "energy_drink"]', '[]', FALSE),
('intro', 'door', 'Tür', 'Die Zimmertür. Hier kann ich das Zimmer verlassen und auf Missionen gehen. Nur verfügbar wenn die Crypto Bank Mission abgeschlossen ist.', 'exit', 80.0, 20.0, 12.0, 18.0, 'DoorOpen', 'city1', '["keycard"]', '["keycard"]', TRUE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    object_type = VALUES(object_type),
    x_position = VALUES(x_position),
    y_position = VALUES(y_position),
    width = VALUES(width),
    height = VALUES(height),
    icon = VALUES(icon),
    exit_room_id = VALUES(exit_room_id),
    compatible_items = VALUES(compatible_items),
    required_items = VALUES(required_items),
    required_missions_completed = VALUES(required_missions_completed);

-- Raum-Objekte für city1 (7 Objekte: Back To Home, 5 Gebäude, Step Forward)
INSERT INTO room_objects (room_id, object_id, name, description, object_type, x_position, y_position, width, height, icon, exit_room_id, required_missions_completed) VALUES
-- Back To Home (ganz links)
('city1', 'back_to_home', 'Zurück nach Hause', 'Zurück zu deinem Zimmer. Hier kannst du dich ausruhen und neue Missionen planen.', 'exit', 5.0, 70.0, 12.0, 20.0, 'Home', 'intro', FALSE),
-- Gebäude 1: Server Farm
('city1', 'building1', 'Server Farm Tower', 'Ein Hochhaus voller Server und Datenbanken. Hier kannst du wertvolle Daten von den Servern stehlen.', 'exit', 20.0, 60.0, 15.0, 30.0, 'Building', 'building1_server_farm', FALSE),
-- Gebäude 2: Tech Office
('city1', 'building2', 'Tech Office Building', 'Ein Bürogebäude einer Tech-Firma. Hier gibt es interessante Daten zu hacken.', 'exit', 37.0, 60.0, 15.0, 30.0, 'Building', 'building2_office', FALSE),
-- Gebäude 3: Research Lab
('city1', 'building3', 'Research Laboratory', 'Ein Forschungslabor mit geheimen Projekten. Vorsicht vor den Sicherheitssystemen.', 'exit', 54.0, 60.0, 15.0, 30.0, 'Building', 'building3_lab', FALSE),
-- Gebäude 4: Data Warehouse
('city1', 'building4', 'Data Warehouse', 'Ein Lagerhaus voller Server und Daten. Perfekt für Datendiebstahl.', 'exit', 71.0, 60.0, 15.0, 30.0, 'Building', 'building4_warehouse', FALSE),
-- Gebäude 5: Executive Penthouse
('city1', 'building5', 'Executive Penthouse', 'Eine Luxus-Penthouse-Wohnung mit hochwertigen Sicherheitssystemen.', 'exit', 88.0, 60.0, 15.0, 30.0, 'Building', 'building5_penthouse', FALSE),
-- Step Forward (ganz rechts) - nur verfügbar wenn alle Missionen abgeschlossen
('city1', 'step_forward', 'Weiter zur nächsten Stadt', 'Weiter zum Downtown District. Nur verfügbar wenn alle Missionen in dieser Stadt abgeschlossen sind.', 'exit', 95.0, 70.0, 12.0, 20.0, 'ArrowRight', 'city2', TRUE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    object_type = VALUES(object_type),
    x_position = VALUES(x_position),
    y_position = VALUES(y_position),
    width = VALUES(width),
    height = VALUES(height),
    icon = VALUES(icon),
    exit_room_id = VALUES(exit_room_id),
    required_missions_completed = VALUES(required_missions_completed);


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
('energy_drink', 'Energy Drink', 'Gibt dir Energie für längere Hacking-Sessions', 'consumable', 'common', 0.00005000, TRUE, 20),
('server_farm_usb', 'Server Farm USB-Stick', 'Ein USB-Stick mit wertvollen Server-Daten. Enthält möglicherweise sensible Informationen.', 'tool', 'rare', 0.00300000, FALSE, 1)
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
('intro', 'keycard', 1),
('building1_server_farm', 'server_farm_usb', 1)
ON DUPLICATE KEY UPDATE 
    quantity = VALUES(quantity);

-- ========================================
-- RÄTSEL FÜR SERVER FARM MISSION (Building 1)
-- ========================================

-- Rätsel 1: Multiple Choice - Firewall-Regeln
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, is_required) VALUES
('puzzle_mc_firewall_rules', 'building1_server_farm', 'Firewall-Regeln', 'Welche Firewall-Regel blockiert SSH-Zugang auf Port 22?', 'multiple_choice', 2, 
'["iptables -A INPUT -p tcp --dport 22 -j DROP"]', 
'["Tipp: Es ist eine iptables-Regel", "Tipp: DROP bedeutet blockieren"]', 
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

-- Multiple Choice Daten für Firewall-Regeln
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('puzzle_mc_firewall_rules', 'multiple_choice', 'question', '"Welche Firewall-Regel blockiert SSH-Zugang auf Port 22?"'),
('puzzle_mc_firewall_rules', 'multiple_choice', 'options', '["iptables -A INPUT -p tcp --dport 22 -j DROP", "iptables -A INPUT -p tcp --dport 22 -j ACCEPT", "iptables -A OUTPUT -p tcp --dport 22 -j DROP", "iptables -A FORWARD -p tcp --dport 22 -j DROP"]'),
('puzzle_mc_firewall_rules', 'multiple_choice', 'correct_answer', '"iptables -A INPUT -p tcp --dport 22 -j DROP"'),
('puzzle_mc_firewall_rules', 'multiple_choice', 'explanation', '"Diese Regel blockiert eingehende TCP-Verbindungen auf Port 22 (SSH) und verwirft sie."')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

-- Rätsel 2: Code-Rätsel - Server-Passwort Hash
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, is_required) VALUES
('puzzle_code_server_hash', 'building1_server_farm', 'Server-Passwort Hash', 'Das Server-System verwendet MD5. Berechne den Hash von "server123".', 'code', 2, 
'["8a16a6b70505eb1f1ff7cdc0cd5559a7"]', 
'["Tipp: MD5 von server123", "Tipp: Verwende einen Online-MD5-Generator"]', 
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

-- Code-Rätsel Daten für Server-Hash
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('puzzle_code_server_hash', 'code', 'code_snippet', '"// Server-System Login\\n// Passwort-Hash: 8a16a6b70505eb1f1ff7cdc0cd5559a7\\n// Finde das ursprüngliche Passwort\\nfunction verifyPassword(input) {\\n    const hash = md5(input);\\n    return hash === \\"8a16a6b70505eb1f1ff7cdc0cd5559a7\\";\\n}"'),
('puzzle_code_server_hash', 'code', 'expected_input', '"8a16a6b70505eb1f1ff7cdc0cd5559a7"'),
('puzzle_code_server_hash', 'code', 'case_sensitive', 'false'),
('puzzle_code_server_hash', 'code', 'allow_partial', 'false'),
('puzzle_code_server_hash', 'code', 'language', '"javascript"')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

-- Rätsel 3: Terminal-Rätsel - Server-Scan
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, is_required) VALUES
('puzzle_terminal_server_scan', 'building1_server_farm', 'Server-Netzwerk scannen', 'Scanne das Server-Netzwerk nach offenen Ports. Verwende nmap für Port 80 (HTTP).', 'terminal_command', 2, 
'["nmap -p 80 10.0.0.50"]', 
'["Tipp: nmap für Port 80", "Tipp: Die Server-IP ist 10.0.0.50"]', 
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

-- Terminal Command Daten für Server-Scan
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('puzzle_terminal_server_scan', 'terminal', 'allowed_commands', '["nmap -p 80 10.0.0.50", "nmap 10.0.0.50", "nmap -p 80,443,22 10.0.0.50"]'),
('puzzle_terminal_server_scan', 'terminal', 'expected_output', '"Starting Nmap 7.80\\nNmap scan report for 10.0.0.50\\nPORT   STATE SERVICE\\n80/tcp open  http\\nNmap done: 1 IP address (1 host up) scanned in 0.05 seconds"'),
('puzzle_terminal_server_scan', 'terminal', 'command', '"nmap -p 80 10.0.0.50"'),
('puzzle_terminal_server_scan', 'terminal', 'working_directory', '"/home/hacker"'),
('puzzle_terminal_server_scan', 'terminal', 'file_system', '{"nmap": "nmap executable", "tools": "directory"}')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

-- ========================================
-- RAUM-OBJEKTE FÜR BUILDING1_SERVER_FARM
-- ========================================

-- Raum-Objekte für building1_server_farm (3 Objekte: Computer, USB-Stick, Exit)
INSERT INTO room_objects (room_id, object_id, name, description, object_type, x_position, y_position, width, height, icon, exit_room_id, puzzle_id, compatible_items, required_items, required_missions_completed) VALUES
-- Computer-Objekt (Rätsel)
('building1_server_farm', 'server_computer', 'Server-Computer', 'Ein Hochleistungs-Server mit wertvollen Daten. Hier kannst du die Server-Sicherheit testen.', 'puzzle', 25.0, 40.0, 20.0, 15.0, 'Monitor', NULL, 'puzzle_mc_firewall_rules', '["laptop", "usb_stick", "hacking_manual"]', '[]', FALSE),
-- USB-Stick (aufhebbares Item)
('building1_server_farm', 'server_farm_usb', 'Server Farm USB-Stick', 'Ein USB-Stick mit wertvollen Server-Daten. Enthält möglicherweise sensible Informationen.', 'item', 60.0, 40.0, 12.0, 8.0, 'Package', NULL, NULL, '[]', '[]', FALSE),
-- Exit (zurück zur Stadt)
('building1_server_farm', 'exit_to_city', 'Zurück zur Stadt', 'Zurück zur Stadtansicht. Hier kannst du andere Gebäude erkunden.', 'exit', 85.0, 20.0, 12.0, 18.0, 'DoorOpen', 'city1', NULL, '["keycard"]', '[]', FALSE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    object_type = VALUES(object_type),
    x_position = VALUES(x_position),
    y_position = VALUES(y_position),
    width = VALUES(width),
    height = VALUES(height),
    icon = VALUES(icon),
    exit_room_id = VALUES(exit_room_id),
    puzzle_id = VALUES(puzzle_id),
    compatible_items = VALUES(compatible_items),
    required_items = VALUES(required_items),
    required_missions_completed = VALUES(required_missions_completed);

-- ========================================
-- TEST-USER ERSTELLEN
-- ========================================

-- Test-User
INSERT INTO users (id, username, password_hash, email, is_admin) VALUES
(1, 'admin', '$2a$12$uT1SkuVC84vByFewn9kIPuWtjpsG0fmw7ldwfZcaO95rJgZjU218y', 'test@example.com', FALSE)
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
(1, 'mission1_crypto_bank', FALSE, 0, 1),
(1, 'mission2_server_farm', FALSE, 0, 0)
ON DUPLICATE KEY UPDATE 
    is_completed = VALUES(is_completed),
    puzzles_completed = VALUES(puzzles_completed),
    rooms_visited = VALUES(rooms_visited);

-- Test-Puzzle-Progress
INSERT INTO puzzle_progress (user_id, puzzle_id, is_completed, attempts, hints_used) VALUES
(1, 'puzzle_mc_bank_security', FALSE, 0, 0),
(1, 'puzzle_code_bank_password', FALSE, 0, 0),
(1, 'puzzle_terminal_bank_scan', FALSE, 0, 0),
(1, 'puzzle_mc_firewall_rules', FALSE, 0, 0),
(1, 'puzzle_code_server_hash', FALSE, 0, 0),
(1, 'puzzle_terminal_server_scan', FALSE, 0, 0)
ON DUPLICATE KEY UPDATE 
    is_completed = VALUES(is_completed),
    attempts = VALUES(attempts),
    hints_used = VALUES(hints_used);

-- ========================================
-- ANALYTICS TABELLEN ERSTELLEN
-- ========================================

-- Puzzle-Interaktionen-Log (für detaillierte Analytics)
CREATE TABLE IF NOT EXISTS puzzle_interaction_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzle_id VARCHAR(100) NOT NULL,
    action_type ENUM('started', 'attempted', 'failed', 'solved', 'skipped', 'timeout', 'hint_used', 'abandoned') NOT NULL,
    attempt_number INT DEFAULT 1,
    time_spent_seconds INT NULL,
    user_input TEXT NULL,
    expected_solution TEXT NULL,
    is_correct BOOLEAN NULL,
    hint_index INT NULL,
    session_id VARCHAR(100) NULL,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_puzzle_id (puzzle_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
);

-- Mission-Interaktionen-Log
CREATE TABLE IF NOT EXISTS mission_interaction_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mission_id VARCHAR(100) NOT NULL,
    action_type ENUM('started', 'puzzle_completed', 'mission_completed', 'abandoned', 'failed') NOT NULL,
    puzzle_id VARCHAR(100) NULL,
    time_spent_seconds INT NULL,
    session_id VARCHAR(100) NULL,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(mission_id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_mission_id (mission_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
);

-- Raum-Besuche-Log
CREATE TABLE IF NOT EXISTS room_visit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id VARCHAR(100) NOT NULL,
    action_type ENUM('entered', 'exited', 'interacted_with_object', 'picked_item') NOT NULL,
    object_id VARCHAR(100) NULL,
    item_id VARCHAR(100) NULL,
    time_spent_seconds INT NULL,
    session_id VARCHAR(100) NULL,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
);

-- Spieler-Sessions-Log
CREATE TABLE IF NOT EXISTS player_session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    total_playtime_seconds INT DEFAULT 0,
    puzzles_attempted INT DEFAULT 0,
    puzzles_solved INT DEFAULT 0,
    missions_started INT DEFAULT 0,
    missions_completed INT DEFAULT 0,
    rooms_visited INT DEFAULT 0,
    items_collected INT DEFAULT 0,
    bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000,
    exp_earned INT DEFAULT 0,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_session_start (session_start),
    INDEX idx_session_end (session_end)
);

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

-- Analytics-Views für Dashboard
CREATE OR REPLACE VIEW puzzle_analytics AS
SELECT 
    p.puzzle_id,
    p.name,
    p.puzzle_type,
    p.difficulty,
    r.name as room_name,
    m.name as mission_name,
    pil.created_at,
    COUNT(pil.id) as total_interactions,
    COUNT(CASE WHEN pil.action_type = 'started' THEN 1 END) as times_started,
    COUNT(CASE WHEN pil.action_type = 'attempted' THEN 1 END) as total_attempts,
    COUNT(CASE WHEN pil.action_type = 'failed' THEN 1 END) as failed_attempts,
    COUNT(CASE WHEN pil.action_type = 'solved' THEN 1 END) as times_solved,
    COUNT(CASE WHEN pil.action_type = 'skipped' THEN 1 END) as times_skipped,
    COUNT(CASE WHEN pil.action_type = 'timeout' THEN 1 END) as times_timeout,
    COUNT(CASE WHEN pil.action_type = 'hint_used' THEN 1 END) as hints_used,
    COUNT(CASE WHEN pil.action_type = 'abandoned' THEN 1 END) as times_abandoned,
    AVG(CASE WHEN pil.time_spent_seconds IS NOT NULL THEN pil.time_spent_seconds END) as avg_time_seconds,
    COUNT(DISTINCT pil.user_id) as unique_users,
    ROUND(
        (COUNT(DISTINCT CASE WHEN pil.action_type = 'solved' THEN pil.user_id END) * 100.0) / 
        NULLIF(COUNT(DISTINCT CASE WHEN pil.action_type IN ('started', 'attempted', 'solved') THEN pil.user_id END), 0), 2
    ) as success_rate_percent
FROM puzzles p
JOIN rooms r ON p.room_id = r.room_id
LEFT JOIN missions m ON r.mission_id = m.mission_id
LEFT JOIN puzzle_interaction_logs pil ON p.puzzle_id = pil.puzzle_id
GROUP BY p.puzzle_id, p.name, p.puzzle_type, p.difficulty, r.name, m.name, pil.created_at
ORDER BY failed_attempts DESC, success_rate_percent ASC;

-- Mission-Analytics
CREATE OR REPLACE VIEW mission_analytics AS
SELECT 
    m.mission_id,
    m.name,
    m.difficulty,
    m.reward_bitcoins,
    m.reward_exp,
    mil.created_at,
    COUNT(mil.id) as total_interactions,
    COUNT(CASE WHEN mil.action_type = 'started' THEN 1 END) as times_started,
    COUNT(CASE WHEN mil.action_type = 'mission_completed' THEN 1 END) as times_completed,
    COUNT(CASE WHEN mil.action_type = 'abandoned' THEN 1 END) as times_abandoned,
    COUNT(CASE WHEN mil.action_type = 'failed' THEN 1 END) as times_failed,
    COUNT(DISTINCT mil.user_id) as unique_users,
    AVG(CASE WHEN mil.time_spent_seconds IS NOT NULL THEN mil.time_spent_seconds END) as avg_time_seconds,
    ROUND(
        (COUNT(CASE WHEN mil.action_type = 'mission_completed' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(CASE WHEN mil.action_type = 'started' THEN 1 END), 0), 2
    ) as completion_rate_percent
FROM missions m
LEFT JOIN mission_interaction_logs mil ON m.mission_id = mil.mission_id
GROUP BY m.mission_id, m.name, m.difficulty, m.reward_bitcoins, m.reward_exp, mil.created_at
ORDER BY completion_rate_percent ASC, times_started DESC;

-- Spieler-Performance-Analytics
CREATE OR REPLACE VIEW player_performance_analytics AS
SELECT 
    u.id,
    u.username,
    u.created_at AS user_created_at,
    psl.created_at AS session_created_at,
    COUNT(DISTINCT psl.session_id) as total_sessions,
    SUM(psl.total_playtime_seconds) as total_playtime_seconds,
    SUM(psl.puzzles_attempted) as total_puzzles_attempted,
    SUM(psl.puzzles_solved) as total_puzzles_solved,
    SUM(psl.missions_started) as total_missions_started,
    SUM(psl.missions_completed) as total_missions_completed,
    SUM(psl.rooms_visited) as total_rooms_visited,
    SUM(psl.items_collected) as total_items_collected,
    SUM(psl.bitcoins_earned) as total_bitcoins_earned,
    SUM(psl.exp_earned) as total_exp_earned,
    AVG(psl.total_playtime_seconds) as avg_session_duration_seconds,
    ROUND(
        (SUM(psl.puzzles_solved) * 100.0) / 
        NULLIF(SUM(psl.puzzles_attempted), 0), 2
    ) as puzzle_success_rate_percent,
    ROUND(
        (SUM(psl.missions_completed) * 100.0) / 
        NULLIF(SUM(psl.missions_started), 0), 2
    ) as mission_success_rate_percent
FROM users u
LEFT JOIN player_session_logs psl ON u.id = psl.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.username, user_created_at, session_created_at
ORDER BY total_playtime_seconds DESC;

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