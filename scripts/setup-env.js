#!/usr/bin/env node

/**
 * Setup-Skript für INTRUSION Umgebungskonfiguration
 * Erstellt automatisch eine .env Datei aus env.example
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🔧 INTRUSION - Umgebungskonfiguration Setup\n');

  const envExamplePath = path.join(__dirname, '..', 'env.example');
  const envPath = path.join(__dirname, '..', '.env');

  // Prüfe, ob .env bereits existiert
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env Datei existiert bereits. Überschreiben? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('❌ Setup abgebrochen.');
      rl.close();
      return;
    }
  }

  // Lese env.example
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ env.example nicht gefunden!');
    rl.close();
    return;
  }

  let envContent = fs.readFileSync(envExamplePath, 'utf8');

  console.log('📝 Konfiguriere Umgebungsvariablen...\n');

  // Datenbank-Konfiguration
  console.log('🗄️  DATENBANK-KONFIGURATION:');
  const dbHost = await question(`Datenbank-Host (${getDefaultValue(envContent, 'DB_HOST')}): `) || getDefaultValue(envContent, 'DB_HOST');
  const dbPort = await question(`Datenbank-Port (${getDefaultValue(envContent, 'DB_PORT')}): `) || getDefaultValue(envContent, 'DB_PORT');
  const dbUser = await question(`Datenbank-Benutzer (${getDefaultValue(envContent, 'DB_USER')}): `) || getDefaultValue(envContent, 'DB_USER');
  const dbPassword = await question('Datenbank-Passwort: ') || '';
  const dbName = await question(`Datenbank-Name (${getDefaultValue(envContent, 'DB_NAME')}): `) || getDefaultValue(envContent, 'DB_NAME');

  console.log('\n🔐 JWT-KONFIGURATION:');
  const jwtSecret = await question('JWT Secret (mindestens 32 Zeichen): ') || generateJWTSecret();

  console.log('\n⚙️  ANWENDUNGS-KONFIGURATION:');
  const nodeEnv = await question(`Umgebung (${getDefaultValue(envContent, 'NODE_ENV')}): `) || getDefaultValue(envContent, 'NODE_ENV');
  const debug = await question('Debug-Modus (true/false): ') || 'false';

  // Ersetze Werte in der .env Datei
  envContent = replaceValue(envContent, 'DB_HOST', dbHost);
  envContent = replaceValue(envContent, 'DB_PORT', dbPort);
  envContent = replaceValue(envContent, 'DB_USER', dbUser);
  envContent = replaceValue(envContent, 'DB_PASSWORD', dbPassword);
  envContent = replaceValue(envContent, 'DB_NAME', dbName);
  envContent = replaceValue(envContent, 'JWT_SECRET', jwtSecret);
  envContent = replaceValue(envContent, 'NODE_ENV', nodeEnv);
  envContent = replaceValue(envContent, 'DEBUG', debug);

  // Schreibe .env Datei
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env Datei erfolgreich erstellt!');
    console.log('📁 Pfad:', envPath);
    
    console.log('\n🔒 SICHERHEITSHINWEISE:');
    console.log('• Die .env Datei ist bereits in .gitignore enthalten');
    console.log('• Ändere das JWT_SECRET in Produktion');
    console.log('• Verwende starke Passwörter für die Datenbank');
    
    console.log('\n🚀 Nächste Schritte:');
    console.log('1. Starte die Anwendung: npm run dev');
    console.log('2. Überprüfe die Datenbankverbindung');
    console.log('3. Teste die Authentifizierung');
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der .env Datei:', error.message);
  }

  rl.close();
}

function getDefaultValue(content, key) {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1] : '';
}

function replaceValue(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  return content.replace(regex, `${key}=${value}`);
}

function generateJWTSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Starte Setup
setupEnvironment().catch(console.error); 