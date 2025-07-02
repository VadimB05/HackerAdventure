#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// GitHub CLI muss installiert sein: https://cli.github.com/
const GITHUB_CLI_REQUIRED = 'gh';

function checkDependencies() {
  try {
    execSync(`${GITHUB_CLI_REQUIRED} --version`, { stdio: 'ignore' });
    console.log('✅ GitHub CLI ist installiert');
  } catch (error) {
    console.error('❌ GitHub CLI ist nicht installiert!');
    console.error('Installiere es von: https://cli.github.com/');
    process.exit(1);
  }
}

function getRepositoryInfo() {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    
    if (!match) {
      throw new Error('Konnte Repository-Informationen nicht extrahieren');
    }
    
    return {
      owner: match[1],
      repo: match[2]
    };
  } catch (error) {
    console.error('❌ Konnte Repository-Informationen nicht abrufen');
    console.error('Stelle sicher, dass du in einem Git-Repository bist und origin gesetzt ist');
    process.exit(1);
  }
}

function loadSecretsFile() {
  const secretsPath = path.join(process.cwd(), '.env.secrets');
  
  if (!fs.existsSync(secretsPath)) {
    console.error('❌ .env.secrets Datei nicht gefunden!');
    console.error('Kopiere env.secrets.example zu .env.secrets und fülle die Werte aus');
    process.exit(1);
  }
  
  const content = fs.readFileSync(secretsPath, 'utf8');
  const secrets = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        secrets[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return secrets;
}

function setGitHubSecret(owner, repo, key, value) {
  try {
    // Verwende GitHub CLI um das Secret zu setzen
    execSync(`echo "${value}" | gh secret set ${key} --repo ${owner}/${repo}`, {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log(`✅ Secret ${key} gesetzt`);
  } catch (error) {
    console.error(`❌ Fehler beim Setzen von Secret ${key}:`, error.message);
  }
}

function main() {
  console.log('🔧 GitHub Secrets Setup für INTRUSION CI/CD\n');
  
  // Dependencies prüfen
  checkDependencies();
  
  // Repository-Informationen abrufen
  const repoInfo = getRepositoryInfo();
  console.log(`📦 Repository: ${repoInfo.owner}/${repoInfo.repo}\n`);
  
  // Secrets laden
  console.log('📖 Lade Secrets aus .env.secrets...');
  const secrets = loadSecretsFile();
  
  if (Object.keys(secrets).length === 0) {
    console.error('❌ Keine Secrets in .env.secrets gefunden!');
    process.exit(1);
  }
  
  console.log(`✅ ${Object.keys(secrets).length} Secrets gefunden\n`);
  
  // GitHub Authentication prüfen
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    console.log('✅ GitHub Authentication OK\n');
  } catch (error) {
    console.error('❌ GitHub Authentication fehlgeschlagen!');
    console.error('Führe "gh auth login" aus');
    process.exit(1);
  }
  
  // Secrets setzen
  console.log('🚀 Setze Secrets in GitHub...\n');
  
  Object.entries(secrets).forEach(([key, value]) => {
    if (value && value !== 'your-value-here') {
      setGitHubSecret(repoInfo.owner, repoInfo.repo, key, value);
    } else {
      console.log(`⚠️  Secret ${key} übersprungen (nicht gesetzt)`);
    }
  });
  
  console.log('\n🎉 Setup abgeschlossen!');
  console.log('Deine CI/CD-Pipeline ist jetzt bereit.');
  console.log('Pushe in den main Branch um das Deployment zu testen.');
}

if (require.main === module) {
  main();
}

module.exports = { main, loadSecretsFile, getRepositoryInfo }; 