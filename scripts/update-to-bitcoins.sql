-- Update Database Schema to use Bitcoins instead of Money
-- Run this script to migrate existing database

USE intrusion_game;

-- Update missions table
ALTER TABLE missions 
CHANGE COLUMN reward_money reward_bitcoins DECIMAL(10,8) DEFAULT 0.00000000;

-- Update puzzles table
ALTER TABLE puzzles 
CHANGE COLUMN reward_money reward_bitcoins DECIMAL(10,8) DEFAULT 0.00000000;

-- Update game_states table
ALTER TABLE game_states 
CHANGE COLUMN money bitcoins DECIMAL(10,8) DEFAULT 0.00000000;

-- Update player_stats table
ALTER TABLE player_stats 
CHANGE COLUMN total_money_earned total_bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000;

-- Update achievements table
ALTER TABLE achievements 
CHANGE COLUMN required_money_earned required_bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000,
CHANGE COLUMN reward_money reward_bitcoins DECIMAL(10,8) DEFAULT 0.00000000;

-- Update player_sessions table
ALTER TABLE player_sessions 
CHANGE COLUMN money_earned bitcoins_earned DECIMAL(10,8) DEFAULT 0.00000000;

-- Update items table
ALTER TABLE items 
CHANGE COLUMN value value DECIMAL(10,8) DEFAULT 0.00000000;

-- Update existing data to use realistic Bitcoin values
-- Convert old money values to Bitcoin equivalents (1 BTC = ~$40,000 as example)

-- Update missions with realistic Bitcoin rewards
UPDATE missions SET reward_bitcoins = 0.00100000 WHERE mission_id = 'tutorial';
UPDATE missions SET reward_bitcoins = 0.00250000 WHERE mission_id = 'basement_investigation';
UPDATE missions SET reward_bitcoins = 0.00500000 WHERE mission_id = 'city_network';
UPDATE missions SET reward_bitcoins = 0.01000000 WHERE mission_id = 'darknet_operation';

-- Update items with realistic Bitcoin values
UPDATE items SET value = 0.00100000 WHERE item_id = 'laptop';
UPDATE items SET value = 0.00050000 WHERE item_id = 'usb_stick';
UPDATE items SET value = 0.00200000 WHERE item_id = 'keycard';
UPDATE items SET value = 0.00075000 WHERE item_id = 'hacking_manual';
UPDATE items SET value = 0.00005000 WHERE item_id = 'energy_drink';

-- Update any existing puzzles with Bitcoin rewards
UPDATE puzzles SET reward_bitcoins = 0.00010000 WHERE reward_bitcoins = 0.00000000;

-- Update any existing game states to have some starting Bitcoins
UPDATE game_states SET bitcoins = 0.00100000 WHERE bitcoins = 0.00000000;

-- Update player stats to reflect Bitcoin earnings
UPDATE player_stats SET total_bitcoins_earned = 0.00000000 WHERE total_bitcoins_earned IS NULL;

-- Update achievements to use Bitcoin requirements
UPDATE achievements SET required_bitcoins_earned = 0.00100000 WHERE required_bitcoins_earned = 0.00000000;
UPDATE achievements SET reward_bitcoins = 0.00050000 WHERE reward_bitcoins = 0.00000000;

-- Update sessions to use Bitcoin earnings
UPDATE player_sessions SET bitcoins_earned = 0.00000000 WHERE bitcoins_earned IS NULL;

-- Verify the changes
SELECT 'Missions updated' as table_name, COUNT(*) as count FROM missions
UNION ALL
SELECT 'Puzzles updated', COUNT(*) FROM puzzles
UNION ALL
SELECT 'Game states updated', COUNT(*) FROM game_states
UNION ALL
SELECT 'Player stats updated', COUNT(*) FROM player_stats
UNION ALL
SELECT 'Achievements updated', COUNT(*) FROM achievements
UNION ALL
SELECT 'Items updated', COUNT(*) FROM items;

-- Show sample data to verify
SELECT 'Sample Missions:' as info;
SELECT mission_id, name, reward_bitcoins FROM missions LIMIT 5;

SELECT 'Sample Items:' as info;
SELECT item_id, name, value FROM items LIMIT 5; 