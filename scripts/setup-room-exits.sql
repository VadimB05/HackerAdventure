-- Raum-Exit-System Setup

USE intrusion_game;

-- Raum-Exits-Tabelle
CREATE TABLE IF NOT EXISTS room_exits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exit_id VARCHAR(100) UNIQUE NOT NULL,
    source_room_id VARCHAR(100) NOT NULL,
    target_room_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    required_level INT DEFAULT 1,
    required_items JSON DEFAULT '[]',
    unlock_message VARCHAR(255),
    unlock_condition JSON DEFAULT '{}', -- Spezielle Bedingungen (Rätsel gelöst, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (source_room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (target_room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    INDEX idx_source_room (source_room_id),
    INDEX idx_target_room (target_room_id),
    INDEX idx_is_locked (is_locked)
);

-- Beispiel-Exits einfügen
INSERT IGNORE INTO room_exits (exit_id, source_room_id, target_room_id, name, description, is_locked, required_level, required_items, unlock_message) VALUES
('bedroom_to_living_room', 'bedroom', 'living_room', 'Tür zum Wohnzimmer', 'Führe zum Wohnzimmer', FALSE, 1, '[]', 'Wohnzimmer verfügbar'),
('bedroom_to_kitchen', 'bedroom', 'kitchen', 'Tür zur Küche', 'Führe zur Küche', TRUE, 2, '["keycard"]', 'Küche freigeschaltet!'),
('living_room_to_basement', 'living_room', 'basement', 'Tür zum Keller', 'Führe zum Keller', TRUE, 3, '["basement_key"]', 'Keller freigeschaltet!'),
('kitchen_to_office', 'kitchen', 'office', 'Tür zum Büro', 'Führe zum Büro', TRUE, 4, '["office_key", "security_card"]', 'Büro freigeschaltet!'),
('basement_to_server_room', 'basement', 'server_room', 'Tür zum Server-Raum', 'Führe zum Server-Raum', TRUE, 5, '["admin_key", "hacking_tool"]', 'Server-Raum freigeschaltet!');

-- Exit-Freischaltungen-Tabelle (für dynamische Freischaltungen)
CREATE TABLE IF NOT EXISTS exit_unlocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exit_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlock_reason VARCHAR(255), -- 'level', 'items', 'puzzle', 'mission'
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exit_id) REFERENCES room_exits(exit_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_exit (user_id, exit_id),
    INDEX idx_user_id (user_id),
    INDEX idx_exit_id (exit_id)
);

-- Trigger für automatische Exit-Freischaltungen
DELIMITER //

CREATE TRIGGER IF NOT EXISTS check_exit_unlocks
AFTER UPDATE ON game_states
FOR EACH ROW
BEGIN
    -- Prüfe Level-basierte Freischaltungen
    INSERT IGNORE INTO exit_unlocks (user_id, exit_id, unlock_reason)
    SELECT 
        NEW.user_id,
        re.exit_id,
        'level'
    FROM room_exits re
    WHERE re.is_locked = TRUE 
    AND re.required_level <= NEW.level
    AND re.required_items = '[]'
    AND NOT EXISTS (
        SELECT 1 FROM exit_unlocks eu 
        WHERE eu.user_id = NEW.user_id 
        AND eu.exit_id = re.exit_id
    );
END//

DELIMITER ;

-- View für verfügbare Exits pro Spieler
CREATE OR REPLACE VIEW available_exits AS
SELECT 
    u.id as user_id,
    re.exit_id,
    re.source_room_id,
    re.target_room_id,
    re.name,
    re.description,
    re.is_locked,
    re.required_level,
    re.required_items,
    re.unlock_message,
    CASE 
        WHEN re.is_locked = FALSE THEN TRUE
        WHEN gs.level >= re.required_level THEN TRUE
        WHEN re.required_items != '[]' THEN 
            -- Prüfe Item-Anforderungen (vereinfacht)
            JSON_LENGTH(re.required_items) = 0
        ELSE FALSE
    END as is_available,
    eu.unlocked_at,
    eu.unlock_reason
FROM users u
CROSS JOIN room_exits re
LEFT JOIN game_states gs ON u.id = gs.user_id
LEFT JOIN exit_unlocks eu ON u.id = eu.user_id AND re.exit_id = eu.exit_id;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_room_exits_source_target ON room_exits(source_room_id, target_room_id);
CREATE INDEX IF NOT EXISTS idx_exit_unlocks_user_exit ON exit_unlocks(user_id, exit_id); 