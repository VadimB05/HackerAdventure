-- Standard-Missionen für INTRUSION - MANUELLE AUSFÜHRUNG
-- Führe dieses Script in phpMyAdmin oder MySQL Workbench aus

USE intrusion_game;

-- Mission 1: Tutorial/Intro
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_money, reward_exp) 
VALUES ('mission_001', 'Tutorial', 'Deine erste Mission: Lerne die Grundlagen des Hackings', 1, 1, 50.00, 100)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_money = VALUES(reward_money),
    reward_exp = VALUES(reward_exp);

-- Mission 2: Erste Herausforderung
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_money, reward_exp) 
VALUES ('mission_002', 'Erste Herausforderung', 'Zeige deine Hacking-Fähigkeiten', 2, 2, 100.00, 200)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_money = VALUES(reward_money),
    reward_exp = VALUES(reward_exp);

-- Mission 3: Fortgeschritten
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_money, reward_exp) 
VALUES ('mission_003', 'Fortgeschritten', 'Komplexe Hacking-Aufgaben erwarten dich', 3, 3, 200.00, 400)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_money = VALUES(reward_money),
    reward_exp = VALUES(reward_exp);

-- Mission 4: Experte
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_money, reward_exp) 
VALUES ('mission_004', 'Experte', 'Nur für wahre Hacking-Experten', 4, 5, 500.00, 1000)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_money = VALUES(reward_money),
    reward_exp = VALUES(reward_exp);

-- Mission 5: Meister
INSERT INTO missions (mission_id, name, description, difficulty, required_level, reward_money, reward_exp) 
VALUES ('mission_005', 'Meister', 'Die ultimative Hacking-Herausforderung', 5, 10, 1000.00, 2000)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    difficulty = VALUES(difficulty),
    required_level = VALUES(required_level),
    reward_money = VALUES(reward_money),
    reward_exp = VALUES(reward_exp);

-- Standard-Räume für Mission 1
INSERT INTO rooms (room_id, mission_id, name, description, background_image, is_locked, required_level) 
VALUES ('intro', 'mission_001', 'Einleitung', 'Willkommen bei INTRUSION. Du bist ein angehender Hacker, der sich in die digitale Unterwelt wagt.', '/images/rooms/intro.jpg', false, 1)
ON DUPLICATE KEY UPDATE 
    mission_id = VALUES(mission_id),
    name = VALUES(name),
    description = VALUES(description),
    background_image = VALUES(background_image),
    is_locked = VALUES(is_locked),
    required_level = VALUES(required_level);

INSERT INTO rooms (room_id, mission_id, name, description, background_image, is_locked, required_level) 
VALUES ('basement', 'mission_001', 'Keller', 'Ein dunkler Keller mit Computerausrüstung. Hier beginnt deine Hacking-Karriere.', '/images/rooms/basement.jpg', false, 1)
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

-- Überprüfung
SELECT 'Missions und Räume erfolgreich erstellt!' as status;
SELECT COUNT(*) as mission_count FROM missions;
SELECT COUNT(*) as room_count FROM rooms; 