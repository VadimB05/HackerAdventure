-- Multi-Question-Rätsel für das Puzzle-System
-- Führe dieses Script aus, um Multi-Question-Rätsel zu erstellen

-- ZUERST: Alle Puzzle-bezogenen Daten löschen (in korrekter Reihenfolge wegen Foreign Keys)
-- 1. Puzzle-Fortschritt löschen
DELETE FROM puzzle_progress;

-- 2. Puzzle-spezifische Daten löschen
DELETE FROM puzzle_data;

-- 3. Rätsel löschen
DELETE FROM puzzles;

-- 4. Räume löschen (falls sie existieren)
DELETE FROM rooms WHERE room_id IN ('bedroom', 'living_room', 'kitchen');

-- JETZT: Neue Daten einfügen

-- Zuerst die benötigten Räume erstellen
INSERT INTO rooms (room_id, name, description, background_image, is_locked, required_level, required_items, required_puzzles, connections) VALUES
('bedroom', 'Schlafzimmer', 'Ein kleines, spärlich eingerichtetes Schlafzimmer. Hier beginnt deine Reise.', 'room-bedroom.png', false, 1, '[]', '[]', '{}'),
('living_room', 'Wohnzimmer', 'Ein gemütliches Wohnzimmer mit Computer-Arbeitsplatz.', 'room-living-room.png', false, 1, '[]', '[]', '{}'),
('kitchen', 'Küche', 'Eine funktionale Küche mit modernen Geräten.', 'room-kitchen.png', false, 1, '[]', '[]', '{}');

-- Rätsel 1: Netzwerk-Grundlagen (3 Fragen)
INSERT INTO puzzles (
    puzzle_id, room_id, name, description, puzzle_type, difficulty, 
    solution, hints, max_attempts, time_limit_seconds, 
    reward_exp, reward_items, is_required, is_hidden
) VALUES (
    'multi-1', 'bedroom', 'Netzwerk-Grundlagen', 
    'Teste dein Wissen über grundlegende Netzwerkprotokolle und deren Funktionsweise.',
    'multiple_choice', 1,
    '{"expected_input": "multi"}',
    '["Das Protokoll arbeitet auf der Transportschicht", "Es ist verbindungsorientiert", "Es garantiert die Reihenfolge der Pakete"]',
    5, 300,
    75, '[]', true, false
);

-- Rätsel 2: Sicherheitsprotokolle (2 Fragen)
INSERT INTO puzzles (
    puzzle_id, room_id, name, description, puzzle_type, difficulty, 
    solution, hints, max_attempts, time_limit_seconds, 
    reward_exp, reward_items, is_required, is_hidden
) VALUES (
    'multi-2', 'bedroom', 'Sicherheitsprotokolle', 
    'Fragen zu Verschlüsselungsmethoden und Sicherheitsstandards.',
    'multiple_choice', 2,
    '{"expected_input": "multi"}',
    '["Es verwendet asymmetrische Verschlüsselung", "Es arbeitet auf der Transportschicht", "Es ist der Nachfolger von SSL"]',
    4, 240,
    50, '[]', true, false
);

-- Rätsel 3: Linux-Befehle (3 Fragen)
INSERT INTO puzzles (
    puzzle_id, room_id, name, description, puzzle_type, difficulty, 
    solution, hints, max_attempts, time_limit_seconds, 
    reward_exp, reward_items, is_required, is_hidden
) VALUES (
    'multi-3', 'bedroom', 'Linux-Befehle', 
    'Grundlegende Terminal-Befehle und Systemadministration.',
    'multiple_choice', 1,
    '{"expected_input": "multi"}',
    '["Es ist ein sehr kurzer Befehl", "Es steht für list", "Es zeigt Dateien und Ordner an"]',
    6, 180,
    45, '[]', true, false
);

-- Rätsel 1 Daten: Netzwerk-Grundlagen

-- Frage 1
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('multi-1', 'multiple_choice', 'question_1', '"Welches Protokoll arbeitet auf der Transportschicht des TCP/IP-Modells?"'),
('multi-1', 'multiple_choice', 'options_1', '["HTTP (Hypertext Transfer Protocol)", "TCP (Transmission Control Protocol)", "IP (Internet Protocol)", "DNS (Domain Name System)"]'),
('multi-1', 'multiple_choice', 'correct_answer_1', '"b"'),
('multi-1', 'multiple_choice', 'explanation_1', '"TCP (Transmission Control Protocol) arbeitet auf der Transportschicht und stellt eine zuverlässige, verbindungsorientierte Datenübertragung sicher."');

-- Frage 2
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('multi-1', 'multiple_choice', 'question_2', '"Welches Protokoll wird für die Namensauflösung verwendet?"'),
('multi-1', 'multiple_choice', 'options_2', '["HTTP", "FTP", "DNS", "SMTP"]'),
('multi-1', 'multiple_choice', 'correct_answer_2', '"c"'),
('multi-1', 'multiple_choice', 'explanation_2', '"DNS (Domain Name System) übersetzt Domain-Namen in IP-Adressen."');

-- Frage 3
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('multi-1', 'multiple_choice', 'question_3', '"Welches Protokoll ist verbindungslos?"'),
('multi-1', 'multiple_choice', 'options_3', '["TCP", "UDP", "HTTP", "FTP"]'),
('multi-1', 'multiple_choice', 'correct_answer_3', '"b"'),
('multi-1', 'multiple_choice', 'explanation_3', '"UDP (User Datagram Protocol) ist verbindungslos und bietet keine Garantien für die Paketreihenfolge."');

-- Rätsel 2 Daten: Sicherheitsprotokolle

-- Frage 1
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('multi-2', 'multiple_choice', 'question_1', '"Welches Protokoll wird heutzutage für sichere HTTPS-Verbindungen verwendet?"'),
('multi-2', 'multiple_choice', 'options_1', '["SSL (Secure Sockets Layer)", "SSH (Secure Shell)", "TLS (Transport Layer Security)", "FTP (File Transfer Protocol)"]'),
('multi-2', 'multiple_choice', 'correct_answer_1', '"c"'),
('multi-2', 'multiple_choice', 'explanation_1', '"TLS (Transport Layer Security) ist das moderne Protokoll für sichere Web-Verbindungen. Es ist der Nachfolger von SSL und wird für HTTPS verwendet."');

-- Frage 2
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('multi-2', 'multiple_choice', 'question_2', '"Welche Verschlüsselungsart verwendet zwei verschiedene Schlüssel?"'),
('multi-2', 'multiple_choice', 'options_2', '["Symmetrische Verschlüsselung", "Asymmetrische Verschlüsselung", "Hash-Funktionen", "Steganographie"]'),
('multi-2', 'multiple_choice', 'correct_answer_2', '"b"'),
('multi-2', 'multiple_choice', 'explanation_2', '"Asymmetrische Verschlüsselung verwendet ein Schlüsselpaar: einen öffentlichen und einen privaten Schlüssel."');

-- Rätsel 3 Daten: Linux-Befehle

-- Frage 1
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('multi-3', 'multiple_choice', 'question_1', '"Welcher Linux-Befehl zeigt den Inhalt des aktuellen Verzeichnisses an?"'),
('multi-3', 'multiple_choice', 'options_1', '["cat", "ls", "dir", "show"]'),
('multi-3', 'multiple_choice', 'correct_answer_1', '"b"'),
('multi-3', 'multiple_choice', 'explanation_1', '"Der Befehl ls (list) zeigt den Inhalt eines Verzeichnisses an. Er ist einer der grundlegendsten Befehle in Linux-Systemen."');

-- Frage 2
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('multi-3', 'multiple_choice', 'question_2', '"Welcher Befehl ändert das aktuelle Verzeichnis?"'),
('multi-3', 'multiple_choice', 'options_2', '["ls", "cd", "pwd", "mv"]'),
('multi-3', 'multiple_choice', 'correct_answer_2', '"b"'),
('multi-3', 'multiple_choice', 'explanation_2', '"Der Befehl cd (change directory) wechselt das aktuelle Arbeitsverzeichnis."');

-- Frage 3
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('multi-3', 'multiple_choice', 'question_3', '"Welcher Befehl zeigt den aktuellen Pfad an?"'),
('multi-3', 'multiple_choice', 'options_3', '["ls", "cd", "pwd", "path"]'),
('multi-3', 'multiple_choice', 'correct_answer_3', '"c"'),
('multi-3', 'multiple_choice', 'explanation_3', '"Der Befehl pwd (print working directory) zeigt den aktuellen Arbeitspfad an."');

-- Bestätigung und Status-Report
SELECT 'Multi-Question-Rätsel erfolgreich erstellt!' as status;

-- Zeige die erstellten Rätsel an
SELECT 
    p.puzzle_id,
    p.name,
    p.puzzle_type,
    p.difficulty,
    COUNT(pd.id) as data_entries
FROM puzzles p
LEFT JOIN puzzle_data pd ON p.puzzle_id = pd.puzzle_id
WHERE p.puzzle_id LIKE 'multi-%'
GROUP BY p.puzzle_id, p.name, p.puzzle_type, p.difficulty
ORDER BY p.puzzle_id; 