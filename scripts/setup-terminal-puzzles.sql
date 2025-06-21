-- Terminal-Rätsel Setup Script
-- Fügt Terminal-basierte Rätsel in die Datenbank ein

-- Terminal-Rätsel 1: System-Zugriff
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, time_limit_seconds, reward_exp, is_required) VALUES
('terminal_1', 'intro', 'System-Zugriff', 'Finde den korrekten Befehl, um Zugriff auf das System zu erhalten. Verwende SSH, um dich mit dem Server zu verbinden.', 'terminal', 2, JSON_ARRAY('ssh admin@server'), JSON_ARRAY(), 5, 300, 150, FALSE);

-- Hinweise für Terminal-Rätsel 1
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('terminal_1', 'terminal', 'hint_1', JSON_OBJECT('text', 'Der Befehl beginnt mit "ssh"')),
('terminal_1', 'terminal', 'hint_2', JSON_OBJECT('text', 'Du brauchst einen Benutzernamen')),
('terminal_1', 'terminal', 'hint_3', JSON_OBJECT('text', 'Der Benutzername ist "admin"')),
('terminal_1', 'terminal', 'hint_4', JSON_OBJECT('text', 'Der vollständige Befehl ist "ssh admin@server"'));

-- Terminal-Rätsel 2: Datei-Suche
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, time_limit_seconds, reward_exp, is_required) VALUES
('terminal_2', 'intro', 'Datei-Suche', 'Suche nach einer versteckten Datei im System. Versteckte Dateien beginnen mit einem Punkt.', 'terminal', 1, JSON_ARRAY('find . -name ".*" -type f'), JSON_ARRAY(), 3, NULL, 100, FALSE);

-- Hinweise für Terminal-Rätsel 2
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('terminal_2', 'terminal', 'hint_1', JSON_OBJECT('text', 'Verwende den "find" Befehl')),
('terminal_2', 'terminal', 'hint_2', JSON_OBJECT('text', 'Suche nach Dateien mit Punkt am Anfang')),
('terminal_2', 'terminal', 'hint_3', JSON_OBJECT('text', 'Der Befehl ist "find . -name ".*" -type f"'));

-- Terminal-Rätsel 3: Netzwerk-Scan
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, time_limit_seconds, reward_exp, is_required) VALUES
('terminal_3', 'intro', 'Netzwerk-Scan', 'Scanne das Netzwerk nach offenen Ports. Verwende nmap, um alle Ports auf dem Zielsystem zu scannen.', 'terminal', 3, JSON_ARRAY('nmap -p- 192.168.1.1'), JSON_ARRAY(), 7, 600, 200, FALSE);

-- Hinweise für Terminal-Rätsel 3
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('terminal_3', 'terminal', 'hint_1', JSON_OBJECT('text', 'Verwende einen Port-Scanner')),
('terminal_3', 'terminal', 'hint_2', JSON_OBJECT('text', 'Der Befehl beginnt mit "nmap"')),
('terminal_3', 'terminal', 'hint_3', JSON_OBJECT('text', 'Scanne alle Ports mit "-p-"')),
('terminal_3', 'terminal', 'hint_4', JSON_OBJECT('text', 'Die Ziel-IP ist 192.168.1.1')),
('terminal_3', 'terminal', 'hint_5', JSON_OBJECT('text', 'Der vollständige Befehl ist "nmap -p- 192.168.1.1"'));

-- Terminal-Rätsel 4: Passwort-Crack
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, time_limit_seconds, reward_exp, is_required) VALUES
('terminal_4', 'intro', 'Passwort-Crack', 'Cracke das Passwort mit John the Ripper. Die Passwort-Hash-Datei ist "passwords.txt".', 'terminal', 4, JSON_ARRAY('john passwords.txt'), JSON_ARRAY(), 10, 900, 300, FALSE);

-- Hinweise für Terminal-Rätsel 4
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('terminal_4', 'terminal', 'hint_1', JSON_OBJECT('text', 'Verwende John the Ripper')),
('terminal_4', 'terminal', 'hint_2', JSON_OBJECT('text', 'Der Befehl beginnt mit "john"')),
('terminal_4', 'terminal', 'hint_3', JSON_OBJECT('text', 'Die Datei heißt "passwords.txt"')),
('terminal_4', 'terminal', 'hint_4', JSON_OBJECT('text', 'Der vollständige Befehl ist "john passwords.txt"'));

-- Terminal-Rätsel 5: WLAN-Hack
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, time_limit_seconds, reward_exp, is_required) VALUES
('terminal_5', 'intro', 'WLAN-Hack', 'Hacke das WLAN-Netzwerk. Verwende aircrack-ng, um das WPA2-Passwort zu knacken.', 'terminal', 5, JSON_ARRAY('aircrack-ng -w wordlist.txt capture.cap'), JSON_ARRAY(), 15, 1200, 500, FALSE);

-- Hinweise für Terminal-Rätsel 5
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('terminal_5', 'terminal', 'hint_1', JSON_OBJECT('text', 'Verwende aircrack-ng')),
('terminal_5', 'terminal', 'hint_2', JSON_OBJECT('text', 'Du brauchst eine Wortliste')),
('terminal_5', 'terminal', 'hint_3', JSON_OBJECT('text', 'Die Wortliste heißt "wordlist.txt"')),
('terminal_5', 'terminal', 'hint_4', JSON_OBJECT('text', 'Die Capture-Datei heißt "capture.cap"')),
('terminal_5', 'terminal', 'hint_5', JSON_OBJECT('text', 'Verwende "-w" für die Wortliste')),
('terminal_5', 'terminal', 'hint_6', JSON_OBJECT('text', 'Der vollständige Befehl ist "aircrack-ng -w wordlist.txt capture.cap"')); 