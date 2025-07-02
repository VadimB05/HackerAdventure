# CI/CD Setup für INTRUSION Hacker Adventure

## Übersicht

Dieses Repository enthält GitHub Actions Workflows für automatisches CI/CD. Wenn du in den `main` Branch pushst, wird automatisch ein Build erstellt und deployed.

## Workflows

### 1. `deploy.yml` - Basis Workflow
- Führt Build und Tests aus
- Lädt Build-Artefakte hoch
- Enthält Platzhalter für Deployment-Logik

### 2. `deploy-ssh.yml` - Vollständiger SSH-Deployment Workflow
- Vollständiger CI/CD-Pipeline mit SSH-Deployment
- Verwendet PM2 für Prozess-Management
- Enthält Health Checks

## Einrichtung

### 1. GitHub Secrets konfigurieren

Gehe zu deinem GitHub Repository → Settings → Secrets and variables → Actions und füge folgende Secrets hinzu:

#### Für SSH-Deployment (`deploy-ssh.yml`):
```
SERVER_HOST          # IP-Adresse oder Hostname deines Servers
SERVER_USERNAME      # SSH-Benutzername
SERVER_SSH_KEY       # Private SSH-Key (der komplette Key-Inhalt)
SERVER_PORT          # SSH-Port (optional, Standard: 22)
PROJECT_PATH         # Pfad zum Projekt auf dem Server (z.B. /var/www/intrusion)
HEALTH_CHECK_URL     # URL für Health Check (z.B. https://deine-domain.com/api/health)
```

#### Für Umgebungsvariablen:
```
DATABASE_URL         # MySQL-Verbindungsstring
JWT_SECRET          # Secret für JWT-Token
CUSTOM_KEY          # Weitere Umgebungsvariablen
```

### 2. Server vorbereiten

#### Node.js und pnpm installieren:
```bash
# Node.js 18 installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm installieren
npm install -g pnpm

# PM2 installieren
npm install -g pm2
```

#### SSH-Key einrichten:
```bash
# Auf deinem lokalen Rechner
ssh-keygen -t rsa -b 4096 -C "github-actions"
# Den öffentlichen Key auf den Server kopieren
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server.com
```

#### Projektverzeichnis erstellen:
```bash
# Auf dem Server
mkdir -p /var/www/intrusion
cd /var/www/intrusion
git clone https://github.com/your-username/your-repo.git .
```

### 3. Workflow aktivieren

1. Pushe die Workflow-Dateien in dein Repository
2. Gehe zu GitHub → Actions
3. Der Workflow wird automatisch aktiviert

## Verwendung

### Automatisches Deployment
- Jeder Push in den `main` Branch löst automatisch den Workflow aus
- Der Workflow führt folgende Schritte aus:
  1. Code auschecken
  2. Dependencies installieren
  3. TypeScript-Check
  4. Linting
  5. Build erstellen
  6. Deployment via SSH
  7. Health Check

### Manuelles Deployment
Du kannst den Workflow auch manuell auslösen:
1. Gehe zu GitHub → Actions
2. Wähle den gewünschten Workflow
3. Klicke "Run workflow"

## Troubleshooting

### Häufige Probleme:

1. **SSH-Verbindung schlägt fehl**
   - Überprüfe die SSH-Key-Konfiguration
   - Stelle sicher, dass der Benutzer SSH-Zugriff hat

2. **Build schlägt fehl**
   - Überprüfe die Umgebungsvariablen
   - Stelle sicher, dass alle Dependencies korrekt installiert sind

3. **PM2-Probleme**
   - Überprüfe, ob PM2 global installiert ist
   - Stelle sicher, dass der Benutzer PM2-Berechtigungen hat

### Logs überprüfen:
```bash
# Auf dem Server
pm2 logs intrusion-hacker-adventure
pm2 status
```

## Anpassungen

### Umgebungsvariablen hinzufügen:
Bearbeite die Workflow-Datei und füge weitere Umgebungsvariablen hinzu:

```yaml
env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  CUSTOM_KEY: ${{ secrets.CUSTOM_KEY }}
  # Weitere Variablen hier hinzufügen
```

### Deployment-Pfad ändern:
Ändere `PROJECT_PATH` in den GitHub Secrets oder bearbeite den Workflow direkt.

### Health Check anpassen:
Ändere die `HEALTH_CHECK_URL` in den GitHub Secrets oder bearbeite den Workflow.

## Sicherheit

- Verwende immer HTTPS für Health Checks
- Halte SSH-Keys sicher und rotiere sie regelmäßig
- Überprüfe regelmäßig die GitHub Actions Logs
- Verwende starke Secrets für JWT und andere sensitive Daten 