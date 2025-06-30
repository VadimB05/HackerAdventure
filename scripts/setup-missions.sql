-- Standard-Missionen für INTRUSION
-- Führe dieses Script aus, um die grundlegenden Missionen zu erstellen

USE intrusion_game;

-- Tabellen leeren (in der richtigen Reihenfolge wegen Foreign Key Constraints)
DELETE FROM puzzle_data;
DELETE FROM puzzle_progress;
DELETE FROM mission_progress;
DELETE FROM player_achievements;
DELETE FROM player_sessions;
DELETE FROM player_inventory;
DELETE FROM player_stats;
DELETE FROM save_points;
DELETE FROM game_states;
DELETE FROM puzzles;
DELETE FROM room_items;
DELETE FROM rooms;
DELETE FROM missions;

-- Mission 1: Crypto Bank (mit korrekter ID für Frontend)
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission1_crypto_bank', 'Crypto Bank Mission', 'Hacke dich in die Crypto-Bank ein und finde das Passwort', 1, 1, 0.00100000, 100)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Mission 2: Network Hack
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission2_network_hack', 'Network Hack', 'Hacke dich ins Unternehmensnetzwerk ein', 2, 2, 0.00200000, 200)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Mission 3: Darknet Operation
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission3_darknet', 'Darknet Operation', 'Tauche ein in die Tiefen des Darknets', 3, 3, 0.00500000, 400)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Mission 4: Advanced Hacking
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission4_advanced', 'Advanced Hacking', 'Nur für wahre Hacking-Experten', 4, 5, 0.01000000, 1000)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Mission 5: Master Challenge
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_bitcoins, reward_exp) 
VALUES ('mission5_master', 'Master Challenge', 'Die ultimative Hacking-Herausforderung', 5, 10, 0.02000000, 2000)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp);

-- Standard-Räume für Mission 1
INSERT INTO rooms (room_id, mission_id, name, description, background_image, is_locked, required_level) 
VALUES ('intro', 'mission1_crypto_bank', 'Einleitung', 'Willkommen bei INTRUSION. Du bist ein angehender Hacker, der sich in die digitale Unterwelt wagt.', '/images/rooms/intro.jpg', false, 1)
ON DUPLICATE KEY UPDATE 
    mission_id = VALUES(mission_id),
    name = VALUES(name),
    description = VALUES(description),
    background_image = VALUES(background_image),
    is_locked = VALUES(is_locked),
    required_level = VALUES(required_level);

INSERT INTO rooms (room_id, mission_id, name, description, background_image, is_locked, required_level) 
VALUES ('basement', 'mission1_crypto_bank', 'Keller', 'Ein dunkler Keller mit Computerausrüstung. Hier beginnt deine Hacking-Karriere.', '/images/rooms/basement.jpg', false, 1)
ON DUPLICATE KEY UPDATE 
    mission_id = VALUES(mission_id),
    name = VALUES(name),
    description = VALUES(description),
    background_image = VALUES(background_image),
    is_locked = VALUES(is_locked),
    required_level = VALUES(required_level);

-- Verbindungen zwischen Räumen
UPDATE rooms SET connections = '{"basement": {"id": "basement", "name": "Keller", "description": "Ein dunkler Keller mit Computerausrüstung"}}' WHERE room_id = 'intro';
UPDATE rooms SET connections = '{"intro": {"id": "intro", "name": "Einleitung", "description": "Zurück zur Einleitung"}}' WHERE room_id = 'basement';

-- Neue Rätsel für Mission 1 hinzufügen

-- Rätsel 1: Multiple Choice - Bank-Sicherheit
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_bitcoins, reward_exp, is_required) 
VALUES ('puzzle_mc_bank_security', 'intro', 'Bank-Sicherheit', 'Welche Art von Verschlüsselung wird am häufigsten für Online-Banking verwendet?', 'multiple_choice', 1, '["SSL/TLS"]', '["Tipp: Es ist ein Protokoll für sichere Verbindungen", "Tipp: HTTPS verwendet es"]', 3, 0.00050000, 50, 1)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    puzzle_type = VALUES(puzzle_type),
    difficulty = VALUES(difficulty),
    solution = VALUES(solution),
    hints = VALUES(hints),
    max_attempts = VALUES(max_attempts),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp),
    is_required = VALUES(is_required);

-- Rätsel 2: Code-Rätsel - Bank-Passwort knacken
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_bitcoins, reward_exp, is_required) 
VALUES ('puzzle_code_bank_password', 'basement', 'Bank-Passwort knacken', 'Das Bank-System verwendet SHA-256. Berechne den Hash von "bank123".', 'code', 2, '["a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"]', '["Tipp: SHA-256 von bank123", "Tipp: Verwende einen Online-SHA-256-Generator"]', 5, 0.00100000, 75, 1)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    puzzle_type = VALUES(puzzle_type),
    difficulty = VALUES(difficulty),
    solution = VALUES(solution),
    hints = VALUES(hints),
    max_attempts = VALUES(max_attempts),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp),
    is_required = VALUES(is_required);

-- Rätsel 3: Terminal-Rätsel - Bank-System erkunden
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_bitcoins, reward_exp, is_required) 
VALUES ('puzzle_terminal_bank_scan', 'basement', 'Bank-System scannen', 'Scanne das Bank-Netzwerk nach offenen Ports. Verwende nmap für Port 22 (SSH).', 'terminal', 1, '["nmap -p 22 192.168.1.100"]', '["Tipp: nmap für Port 22", "Tipp: Die IP ist 192.168.1.100"]', 3, 0.00075000, 60, 1)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    puzzle_type = VALUES(puzzle_type),
    difficulty = VALUES(difficulty),
    solution = VALUES(solution),
    hints = VALUES(hints),
    max_attempts = VALUES(max_attempts),
    reward_bitcoins = VALUES(reward_bitcoins),
    reward_exp = VALUES(reward_exp),
    is_required = VALUES(is_required);

-- Puzzle-Daten für Multiple Choice Rätsel (Bank-Sicherheit)
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) 
VALUES ('puzzle_mc_bank_security', 'multiple_choice', 'question', '"Welche Art von Verschlüsselung wird am häufigsten für Online-Banking verwendet?"')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) 
VALUES ('puzzle_mc_bank_security', 'multiple_choice', 'options', '["SSL/TLS", "MD5", "DES", "ROT13"]')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) 
VALUES ('puzzle_mc_bank_security', 'multiple_choice', 'correct_answer', '"SSL/TLS"')
ON DUPLICATE KEY UPDATE 
    data_value = VALUES(data_value);

SELECT 'Missions, Räume und Rätsel erfolgreich erstellt!' as status; 