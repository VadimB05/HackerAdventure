-- Setup für verschiedene Rätseltypen
-- Beispiel-Daten für das erweiterte Rätsel-System

-- Multiple Choice Rätsel
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_money, reward_exp, is_required) VALUES
('intro_quiz_1', 'intro', 'Hacking-Grundlagen Quiz', 'Teste dein Wissen über ethisches Hacking', 'multiple_choice', 1, 
'{"correct_answer": "b", "explanation": "Ethisches Hacking dient der Sicherheitsanalyse"}', 
'["Denke an die Definition von ethischem Hacking", "Was ist der Hauptzweck von Penetration Testing?"]', 
3, 10.00, 50, TRUE);

-- Multiple Choice Daten
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('intro_quiz_1', 'multiple_choice', 'question', '"Was ist der Hauptzweck von ethischem Hacking?"'),
('intro_quiz_1', 'multiple_choice', 'options', '["a) Systeme hacken und Daten stehlen", "b) Sicherheitslücken finden und beheben", "c) Passwörter knacken", "d) Viren verbreiten"]'),
('intro_quiz_1', 'multiple_choice', 'correct_answer', '"b"'),
('intro_quiz_1', 'multiple_choice', 'explanation', '"Ethisches Hacking dient der Sicherheitsanalyse und dem Schutz von Systemen."');

-- Code-Rätsel (Text-Eingabe)
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_money, reward_exp, is_required) VALUES
('terminal_password_1', 'intro', 'Terminal Passwort', 'Finde das versteckte Passwort im Code', 'code', 2, 
'{"expected_input": "admin123", "case_sensitive": false, "allow_partial": false}', 
'["Schau dir die Kommentare im Code genau an", "Das Passwort ist in einem Kommentar versteckt"]', 
5, 25.00, 100, TRUE);

-- Code-Rätsel Daten
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('terminal_password_1', 'code', 'code_snippet', '"// TODO: Passwort ändern - aktuell: admin123\nfunction login(username, password) {\n    if (username === \"admin\" && password === \"admin123\") {\n        return true;\n    }\n    return false;\n}"'),
('terminal_password_1', 'code', 'expected_input', '"admin123"'),
('terminal_password_1', 'code', 'case_sensitive', 'false'),
('terminal_password_1', 'code', 'allow_partial', 'false'),
('terminal_password_1', 'code', 'language', '"javascript"');

-- Terminal Command Rätsel
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_money, reward_exp, is_required) VALUES
('terminal_ls_1', 'intro', 'Datei-Exploration', 'Liste alle Dateien im aktuellen Verzeichnis auf', 'terminal_command', 1, 
'{"allowed_commands": ["ls", "ls -la", "dir"], "expected_output": "file1.txt file2.txt secret.txt", "command": "ls"}', 
'["Verwende ls um Dateien aufzulisten", "Schau dir alle Optionen von ls an"]', 
3, 15.00, 75, FALSE);

-- Terminal Command Daten
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('terminal_ls_1', 'terminal', 'allowed_commands', '["ls", "ls -la", "ls -l", "dir"]'),
('terminal_ls_1', 'terminal', 'expected_output', '"file1.txt file2.txt secret.txt"'),
('terminal_ls_1', 'terminal', 'command', '"ls"'),
('terminal_ls_1', 'terminal', 'working_directory', '"/home/user/documents"'),
('terminal_ls_1', 'terminal', 'file_system', '{"file1.txt": "content1", "file2.txt": "content2", "secret.txt": "secret content"}');

-- Password/Hash Rätsel
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_money, reward_exp, is_required) VALUES
('hash_crack_1', 'intro', 'Hash Cracking', 'Cracke den MD5 Hash', 'password', 3, 
'{"hash_type": "md5", "expected_hash": "5f4dcc3b5aa765d61d8327deb882cf99", "plaintext": "password", "salt": null}', 
'["MD5 ist ein bekannter Hash-Algorithmus", "Versuche einfache Passwörter"]', 
10, 50.00, 200, FALSE);

-- Password/Hash Daten
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('hash_crack_1', 'password', 'hash_type', '"md5"'),
('hash_crack_1', 'password', 'expected_hash', '"5f4dcc3b5aa765d61d8327deb882cf99"'),
('hash_crack_1', 'password', 'plaintext', '"password"'),
('hash_crack_1', 'password', 'salt', 'null'),
('hash_crack_1', 'password', 'hint_text', '"Das Passwort ist ein sehr häufiges Wort"');

-- Sequence/Pattern Rätsel
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_money, reward_exp, is_required) VALUES
('sequence_1', 'intro', 'Zahlenfolge', 'Finde die nächste Zahl in der Folge', 'sequence', 2, 
'{"sequence": [2, 4, 8, 16, 32], "next_number": 64, "pattern": "multiply_by_2"}', 
'["Schau dir die Differenzen zwischen den Zahlen an", "Jede Zahl wird mit 2 multipliziert"]', 
5, 30.00, 150, FALSE);

-- Sequence Daten
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('sequence_1', 'sequence', 'sequence', '[2, 4, 8, 16, 32]'),
('sequence_1', 'sequence', 'next_number', '64'),
('sequence_1', 'sequence', 'pattern', '"multiply_by_2"'),
('sequence_1', 'sequence', 'pattern_description', '"Jede Zahl wird mit 2 multipliziert"'),
('sequence_1', 'sequence', 'hint_numbers', '[2, 4, 8, 16, 32, "?"]');

-- Logic/Puzzle Rätsel
INSERT INTO puzzles (puzzle_id, room_id, name, description, puzzle_type, difficulty, solution, hints, max_attempts, reward_money, reward_exp, is_required) VALUES
('logic_1', 'intro', 'Logik-Rätsel', 'Löse das Logik-Problem', 'logic', 2, 
'{"solution": "42", "logic_type": "mathematical", "equation": "x + 10 = 52"}', 
'["Es ist eine einfache mathematische Gleichung", "x + 10 = 52"]', 
3, 20.00, 100, FALSE);

-- Logic Daten
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('logic_1', 'logic', 'problem_text', '"Wenn x + 10 = 52, was ist dann x?"'),
('logic_1', 'logic', 'solution', '42'),
('logic_1', 'logic', 'logic_type', '"mathematical"'),
('logic_1', 'logic', 'equation', '"x + 10 = 52"'),
('logic_1', 'logic', 'steps', '["1. x + 10 = 52", "2. x = 52 - 10", "3. x = 42"]'); 