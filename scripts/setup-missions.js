const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Einfache .env-Datei-Lesung ohne externe Bibliothek
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    return envVars;
  }
  return {};
}

const env = loadEnv();

// DB-Zugangsdaten aus .env oder Defaults
const DB_HOST = env.DB_HOST || 'localhost';
const DB_USER = env.DB_USER || 'root';
const DB_PASSWORD = env.DB_PASSWORD || '';
const DB_NAME = env.DB_NAME || 'intrusion_game';

async function setupMissions() {
  try {
    console.log('🚀 Starte Setup der Missionen...');
    console.log(`📊 Verbinde mit DB: ${DB_HOST}/${DB_NAME} als ${DB_USER}`);
    
    const db = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true
    });
    
    // SQL-Script einlesen
    const sqlPath = path.join(__dirname, 'setup-missions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // SQL-Befehle ausführen
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`📝 Führe aus: ${command.substring(0, 50)}...`);
        await db.execute(command);
      }
    }
    
    console.log('✅ Missionen erfolgreich eingerichtet!');
    
    // Test: Prüfe ob Missionen existieren
    const [missions] = await db.execute('SELECT mission_id, name FROM missions');
    console.log(`📊 Gefundene Missionen: ${missions.length}`);
    missions.forEach(mission => {
      console.log(`  - ${mission.mission_id}: ${mission.name}`);
    });
    
    // Test: Prüfe ob Räume existieren
    const [rooms] = await db.execute('SELECT room_id, name, mission_id FROM rooms');
    console.log(`🏠 Gefundene Räume: ${rooms.length}`);
    rooms.forEach(room => {
      console.log(`  - ${room.room_id}: ${room.name} (Mission: ${room.mission_id})`);
    });
    
    await db.end();
    
  } catch (error) {
    console.error('❌ Fehler beim Setup der Missionen:', error);
    process.exit(1);
  }
}

// Script ausführen wenn direkt aufgerufen
if (require.main === module) {
  setupMissions();
}

module.exports = { setupMissions }; 