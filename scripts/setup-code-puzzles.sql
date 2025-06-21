-- Code-Eingabe-Rätsel Setup Script
-- Löscht alte Code-Rätsel und fügt neue hinzu

-- Alte Code-Rätsel löschen (mit Fremdschlüssel-Constraints)
DELETE FROM puzzle_progress WHERE puzzle_id IN (
    SELECT puzzle_id FROM puzzles WHERE puzzle_type IN ('code', 'password', 'sequence')
);

DELETE FROM puzzle_data WHERE puzzle_id IN (
    SELECT puzzle_id FROM puzzles WHERE puzzle_type IN ('code', 'password', 'sequence')
);

DELETE FROM puzzles WHERE puzzle_type IN ('code', 'password', 'sequence');

-- Code-Rätsel 1: Sicherheitscode
INSERT INTO puzzles (
    puzzle_id, room_id, name, description, puzzle_type, difficulty, 
    solution, max_attempts, time_limit_seconds, reward_exp, reward_items, 
    is_required, is_hidden
) VALUES (
    'code_lock_1', 'bedroom', 'Sicherheitscode', 
    'Finde den 4-stelligen Sicherheitscode für das Schloss. Schau dir die Hinweise genau an.',
    'code', 1, '["1945"]', 5, 120, 50, '[]', false, false
);

-- Code-Rätsel 2: Passwort-Hash
INSERT INTO puzzles (
    puzzle_id, room_id, name, description, puzzle_type, difficulty, 
    solution, max_attempts, time_limit_seconds, reward_exp, reward_items, 
    is_required, is_hidden
) VALUES (
    'password_hash_1', 'bedroom', 'Passwort-Hash', 
    'Entschlüssele den MD5-Hash "5d41402abc4b2a76b9719d911017c592" und finde das ursprüngliche Passwort.',
    'password', 3, '["hello"]', 10, 300, 100, '[]', false, false
);

-- Code-Rätsel 3: Zahlenfolge
INSERT INTO puzzles (
    puzzle_id, room_id, name, description, puzzle_type, difficulty, 
    solution, max_attempts, time_limit_seconds, reward_exp, reward_items, 
    is_required, is_hidden
) VALUES (
    'sequence_code_1', 'bedroom', 'Zahlenfolge', 
    'Finde die nächste Zahl in der Folge: 2, 4, 8, 16, ?',
    'sequence', 2, '["32"]', 3, 180, 75, '[]', false, false
);

-- Code-Rätsel 4: Binärer Code
INSERT INTO puzzles (
    puzzle_id, room_id, name, description, puzzle_type, difficulty, 
    solution, max_attempts, time_limit_seconds, reward_exp, reward_items, 
    is_required, is_hidden
) VALUES (
    'binary_code_1', 'bedroom', 'Binärer Code', 
    'Konvertiere den Binärcode "101010" in eine Dezimalzahl.',
    'code', 2, '["42"]', 5, 240, 60, '[]', false, false
);

-- Code-Rätsel 5: Caesar-Chiffre
INSERT INTO puzzles (
    puzzle_id, room_id, name, description, puzzle_type, difficulty, 
    solution, max_attempts, time_limit_seconds, reward_exp, reward_items, 
    is_required, is_hidden
) VALUES (
    'caesar_cipher_1', 'bedroom', 'Caesar-Chiffre', 
    'Entschlüssele die Nachricht "khoor" mit einer Verschiebung von 3 Buchstaben.',
    'password', 2, '["hello"]', 7, 200, 80, '[]', false, false
);

-- Hinweise für Code-Rätsel 1 (Sicherheitscode)
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('code_lock_1', 'hint', 'hint_1', JSON_OBJECT('text', 'Der Code ist eine Jahreszahl')),
('code_lock_1', 'hint', 'hint_2', JSON_OBJECT('text', 'Es ist ein Jahr aus dem 20. Jahrhundert')),
('code_lock_1', 'hint', 'hint_3', JSON_OBJECT('text', 'Das Jahr endet mit einer 5')),
('code_lock_1', 'hint', 'hint_4', JSON_OBJECT('text', 'Es war ein wichtiges Jahr für Deutschland'));

-- Hinweise für Code-Rätsel 2 (Passwort-Hash)
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('password_hash_1', 'hint', 'hint_1', JSON_OBJECT('text', 'Das Passwort ist ein Grußwort')),
('password_hash_1', 'hint', 'hint_2', JSON_OBJECT('text', 'Es hat 5 Buchstaben')),
('password_hash_1', 'hint', 'hint_3', JSON_OBJECT('text', 'Es beginnt mit einem h')),
('password_hash_1', 'hint', 'hint_4', JSON_OBJECT('text', 'Es wird oft am Telefon gesagt (English)'));

-- Hinweise für Code-Rätsel 3 (Zahlenfolge)
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('sequence_code_1', 'hint', 'hint_1', JSON_OBJECT('text', 'Jede Zahl wird mit sich selbst multipliziert')),
('sequence_code_1', 'hint', 'hint_2', JSON_OBJECT('text', '2 × 2 = 4, 4 × 2 = 8, 8 × 2 = 16')),
('sequence_code_1', 'hint', 'hint_3', JSON_OBJECT('text', '16 × 2 = ?'));

-- Hinweise für Code-Rätsel 4 (Binärer Code)
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('binary_code_1', 'hint', 'hint_1', JSON_OBJECT('text', 'Binär bedeutet Basis 2')),
('binary_code_1', 'hint', 'hint_2', JSON_OBJECT('text', 'Jede Position steht für eine Potenz von 2')),
('binary_code_1', 'hint', 'hint_3', JSON_OBJECT('text', 'Von rechts nach links: 2^0, 2^1, 2^2, 2^3, 2^4, 2^5')),
('binary_code_1', 'hint', 'hint_4', JSON_OBJECT('text', '101010 = 1×32 + 0×16 + 1×8 + 0×4 + 1×2 + 0×1'));

-- Hinweise für Code-Rätsel 5 (Caesar-Chiffre)
INSERT INTO puzzle_data (puzzle_id, data_type, data_key, data_value) VALUES
('caesar_cipher_1', 'hint', 'hint_1', JSON_OBJECT('text', 'Jeder Buchstabe wird um 3 Positionen verschoben')),
('caesar_cipher_1', 'hint', 'hint_2', JSON_OBJECT('text', 'A wird zu D, B wird zu E, usw.')),
('caesar_cipher_1', 'hint', 'hint_3', JSON_OBJECT('text', 'Verschiebe jeden Buchstabe um 3 Positionen zurück')),
('caesar_cipher_1', 'hint', 'hint_4', JSON_OBJECT('text', 'k→h, h→e, o→l, o→l, r→o'));

-- Bestätigung
SELECT 'Code-Rätsel erfolgreich erstellt!' as status;
SELECT COUNT(*) as total_puzzles FROM puzzles WHERE puzzle_type IN ('code', 'password', 'sequence');
SELECT puzzle_id, name, puzzle_type, difficulty FROM puzzles WHERE puzzle_type IN ('code', 'password', 'sequence') ORDER BY difficulty; 