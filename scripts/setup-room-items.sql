-- Test-Items in Räume platzieren

USE intrusion_game;

-- Test-Items in das Schlafzimmer platzieren
INSERT IGNORE INTO room_items (room_id, item_id, quantity) VALUES
('bedroom', 'laptop', 1),
('bedroom', 'usb_stick', 2),
('bedroom', 'keycard', 1);

-- Test-Items in das Wohnzimmer platzieren
INSERT IGNORE INTO room_items (room_id, item_id, quantity) VALUES
('living_room', 'hacking_manual', 1),
('living_room', 'energy_drink', 3);

-- Test-Items in die Küche platzieren
INSERT IGNORE INTO room_items (room_id, item_id, quantity) VALUES
('kitchen', 'keycard', 1),
('kitchen', 'usb_stick', 1);

-- Test-Items in den Keller platzieren
INSERT IGNORE INTO room_items (room_id, item_id, quantity) VALUES
('basement', 'laptop', 1),
('basement', 'hacking_manual', 1);

-- Überprüfung der eingefügten Daten
SELECT 
    ri.room_id,
    ri.item_id,
    ri.quantity,
    i.name,
    i.description,
    i.item_type,
    i.rarity
FROM room_items ri
JOIN items i ON ri.item_id = i.id
ORDER BY ri.room_id, i.name; 