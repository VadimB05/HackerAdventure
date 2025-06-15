-- Tabelle: users (Benutzerkonten)
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,     -- eindeutige Benutzer-ID
  `username` VARCHAR(50) NOT NULL,      -- Benutzername (muss eindeutig sein)
  `password` VARCHAR(255) NOT NULL,     -- Klartext-Passwort (nur für Tests; in Produktion gehasht speichern!)
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,  -- Admin-Flag (1 = Administrator, 0 = normaler Spieler)
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)  -- eindeutiger Benutzername
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Einfügen von Beispiel-Benutzern
INSERT INTO `users` (`id`, `username`, `password`, `is_admin`) VALUES
(1, 'spieler1', 'passwort123', 0),
(2, 'spieler2', 'passwort456', 0),
(3, 'admin',    'adminpass',   1);


-- Tabelle: missions (Story-Kapitel)
CREATE TABLE `missions` (
  `id` INT NOT NULL AUTO_INCREMENT,   -- eindeutige Missions-ID
  `title` VARCHAR(100) NOT NULL,      -- Titel des Kapitels/Mission
  `description` TEXT NOT NULL,        -- Beschreibung der Mission (Story-Inhalt)
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel-Missionen einfügen
INSERT INTO `missions` (`id`, `title`, `description`) VALUES
(1, 'Kapitel 1: Erste Schritte', 'Einführung in die Geschichte, der Spieler lernt die Grundlagen.'),
(2, 'Kapitel 2: Der erste Hack', 'Der Spieler dringt tiefer in das gesicherte Netzwerk ein.'),
(3, 'Kapitel 3: Showdown', 'Die finale Herausforderung im Kontrollzentrum des Systems.');

-- Tabelle: rooms (Räume pro Mission)
CREATE TABLE `rooms` (
  `id` INT NOT NULL AUTO_INCREMENT,   -- eindeutige Raum-ID
  `mission_id` INT NOT NULL,          -- Referenz auf zugehörige Mission
  `name` VARCHAR(100) NOT NULL,       -- Name des Raums
  `description` TEXT NOT NULL,        -- Beschreibung des Raums
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_rooms_mission`
    FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`)
    ON DELETE CASCADE                 -- wenn Mission gelöscht wird, alle zugehörigen Räume löschen
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel-Räume einfügen
INSERT INTO `rooms` (`id`, `mission_id`, `name`, `description`) VALUES
(1, 1, 'Lobby',           'Eingangsbereich des Gebäudes.'),
(2, 1, 'Sicherheitsraum', 'Überwachungsraum mit Sicherheitskonsolen.'),
(3, 2, 'Serverraum',      'Raum mit wichtigen Server-Schaltschränken.'),
(4, 2, 'Büro',            'Büro des Systemadministrators.'),
(5, 3, 'Kontrollzentrum', 'Hauptkontrollraum des Systems.'),
(6, 3, 'Datenarchiv',     'Geheimer Datenarchiv-Raum im obersten Stock.');

-- Tabelle: items (spielbare Gegenstände)
CREATE TABLE `items` (
  `id` INT NOT NULL AUTO_INCREMENT,  -- eindeutige Item-ID
  `name` VARCHAR(100) NOT NULL,      -- Name des Gegenstands
  `description` TEXT NOT NULL,       -- Beschreibung des Gegenstands
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel-Items einfügen
INSERT INTO `items` (`id`, `name`, `description`) VALUES
(1, 'USB-Stick', 'Ein USB-Stick mit verschlüsselten Daten.'),
(2, 'Keycard',   'Eine Schlüsselkarte für den Türzugang.'),
(3, 'Notiz',     'Ein handgeschriebener Zettel mit einem Code.');

-- Tabelle: puzzles (Rätseldefinitionen)
CREATE TABLE `puzzles` (
  `id` INT NOT NULL AUTO_INCREMENT,                        -- eindeutige Rätsel-ID
  `type` ENUM('code','multiple_choice','terminal') NOT NULL,  -- Art des Rätsels
  `prompt` TEXT NOT NULL,                                  -- Rätseltext oder Frage
  `solution` VARCHAR(100) NOT NULL,                        -- Lösung (Code, richtige Antwort etc.)
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel-Rätsel einfügen
INSERT INTO `puzzles` (`id`, `type`, `prompt`, `solution`) VALUES
(1, 'code',            'Die Türkonsole blinkt und verlangt einen 4-stelligen Code.',    '8153'),
(2, 'multiple_choice', 'Sicherheitsfrage: Wie lautet das Master-Passwort? (A) letmein (B) 12345 (C) geheim', 'geheim'),
(3, 'terminal',        'Auf dem Terminal erscheint: Zugriff verweigert. Gib einen Admin-Befehl ein, um das System herunterzufahren.', 'shutdown -h');

-- Tabelle: objects (Objekte in Räumen, enthalten Items oder Rätsel)
CREATE TABLE `objects` (
  `id` INT NOT NULL AUTO_INCREMENT,               -- eindeutige Objekt-ID
  `room_id` INT NOT NULL,                         -- Referenz auf Raum, in dem das Objekt steht
  `name` VARCHAR(100) NOT NULL,                   -- Bezeichnung des Objekts
  `description` TEXT NOT NULL,                    -- Beschreibung des Objekts
  `type` ENUM('item','puzzle') NOT NULL,          -- Objekttyp: 'item' für Gegenstand, 'puzzle' für Rätsel
  `item_id` INT DEFAULT NULL,                     -- falls type='item': Referenz auf Items.id
  `puzzle_id` INT DEFAULT NULL,                   -- falls type='puzzle': Referenz auf Puzzles.id
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_objects_room`
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`)
    ON DELETE CASCADE,                            -- wenn Raum gelöscht wird, alle zugehörigen Objekte löschen
  CONSTRAINT `fk_objects_item`
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`)
    ON DELETE CASCADE,                            -- wenn Item gelöscht wird, zugehöriges Objekt entfernen
  CONSTRAINT `fk_objects_puzzle`
    FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`)
    ON DELETE CASCADE                             -- wenn Rätsel gelöscht wird, zugehöriges Objekt entfernen
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel-Objekte einfügen
INSERT INTO `objects` (`id`, `room_id`, `name`, `description`, `type`, `item_id`, `puzzle_id`) VALUES
(1, 1, 'Notizzettel',    'Ein zusammengefalteter Notizzettel liegt auf dem Boden.',       'item',   3,  NULL),
(2, 1, 'Türkonsole',     'Ein Tastenfeld neben der Tür, das einen Code benötigt.',        'puzzle', NULL, 1),
(3, 2, 'Keycard',        'Auf dem Tisch liegt eine Zugangskarte (Keycard).',             'item',   2,  NULL),
(4, 3, 'USB-Stick',      'Ein USB-Stick steckt in einem der Server.',                     'item',   1,  NULL),
(5, 4, 'Terminal',       'Ein Computer-Terminal zeigt eine Sicherheitsfrage an.',         'puzzle', NULL, 2),
(6, 5, 'Admin-Konsole',  'Eine Administrator-Konsole fordert einen Eingabebefehl.',       'puzzle', NULL, 3);

-- Tabelle: user_items (Items im Besitz von Benutzern)
CREATE TABLE `user_items` (
  `user_id` INT NOT NULL,   -- Referenz auf users.id
  `item_id` INT NOT NULL,   -- Referenz auf items.id
  PRIMARY KEY (`user_id`, `item_id`),
  CONSTRAINT `fk_user_items_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE,      -- wenn Benutzer gelöscht wird, dessen Inventar-Einträge löschen
  CONSTRAINT `fk_user_items_item`
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`)
    ON DELETE CASCADE       -- wenn Item gelöscht wird, entsprechende Einträge löschen
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel-Inventar (Items je Benutzer) einfügen
INSERT INTO `user_items` (`user_id`, `item_id`) VALUES
(1, 2),  -- spieler1 besitzt Keycard
(1, 3),  -- spieler1 besitzt Notiz
(2, 1),  -- spieler2 besitzt USB-Stick
(2, 2),  -- spieler2 besitzt Keycard
(2, 3);  -- spieler2 besitzt Notiz

-- Tabelle: user_puzzles (gelöste Rätsel pro Benutzer)
CREATE TABLE `user_puzzles` (
  `user_id` INT NOT NULL,    -- Referenz auf users.id (Spieler)
  `puzzle_id` INT NOT NULL,  -- Referenz auf puzzles.id (Rätsel)
  `solved_at` DATETIME NOT NULL,  -- Zeitpunkt, zu dem der Spieler das Rätsel gelöst hat
  PRIMARY KEY (`user_id`, `puzzle_id`),
  CONSTRAINT `fk_user_puzzles_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE,       -- wenn Benutzer gelöscht wird, dessen Rätsel-Einträge löschen
  CONSTRAINT `fk_user_puzzles_puzzle`
    FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`)
    ON DELETE CASCADE        -- wenn Rätsel gelöscht wird, zugehörige Einträge entfernen
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel gelöster Rätsel einfügen
INSERT INTO `user_puzzles` (`user_id`, `puzzle_id`, `solved_at`) VALUES
(1, 1, '2025-06-15 09:00:00'),  -- spieler1 hat Rätsel 1 (Code) gelöst
(1, 2, '2025-06-15 09:30:00'),  -- spieler1 hat Rätsel 2 (Multiple Choice) gelöst
(2, 1, '2025-06-14 10:00:00'),  -- spieler2 hat Rätsel 1 (Code) gelöst
(2, 2, '2025-06-14 10:05:00'),  -- spieler2 hat Rätsel 2 (Multiple Choice) gelöst
(2, 3, '2025-06-14 10:20:00');  -- spieler2 hat Rätsel 3 (Terminal) gelöst

-- Tabelle: user_progress (aktueller Fortschritt je Benutzer)
CREATE TABLE `user_progress` (
  `user_id` INT NOT NULL,    -- Referenz auf users.id (Spieler)
  `mission_id` INT NOT NULL, -- aktuelle Missions-ID des Spielers
  `room_id` INT NULL,        -- aktueller Raum des Spielers (NULL möglich, falls kein Raum aktiv)
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_progress_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE,       -- wenn Benutzer gelöscht wird, Fortschrittseintrag löschen
  CONSTRAINT `fk_user_progress_mission`
    FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`)
    ON DELETE CASCADE,       -- wenn Mission gelöscht wird, Fortschrittseintrag löschen
  CONSTRAINT `fk_user_progress_room`
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`)
    ON DELETE SET NULL       -- wenn aktueller Raum gelöscht wird, Raum auf NULL setzen
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel-Fortschritt je Benutzer einfügen
INSERT INTO `user_progress` (`user_id`, `mission_id`, `room_id`) VALUES
(1, 3, 5),  -- spieler1 befindet sich in Mission 3, Raum 5 (Kontrollzentrum)
(2, 3, 6),  -- spieler2 befindet sich in Mission 3, Raum 6 (Datenarchiv)
(3, 2, 4);  -- admin (Test-Admin-Spieler) befindet sich in Mission 2, Raum 4 (Büro)
