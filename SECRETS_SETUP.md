# 🔐 Secrets Setup für CI/CD

## Schnellstart

### 1. GitHub CLI installieren
```bash
# Windows (mit winget)
winget install GitHub.cli

# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### 2. GitHub CLI einloggen
```bash
gh auth login
```

### 3. Secrets-Datei erstellen
```bash
# Kopiere die Beispiel-Datei
cp env.secrets.example .env.secrets

# Bearbeite die Datei mit deinen echten Werten
notepad .env.secrets  # Windows
# oder
nano .env.secrets     # Linux/macOS
```

### 4. Secrets automatisch hochladen
```bash
pnpm run setup-secrets
```

## 📝 Secrets konfigurieren

Bearbeite die `.env.secrets` Datei und fülle folgende Werte aus:

### Server-Konfiguration
```bash
SERVER_HOST=192.168.1.100          # Deine Server-IP
SERVER_USERNAME=deploy              # SSH-Benutzername
SERVER_PORT=22                      # SSH-Port (Standard: 22)
PROJECT_PATH=/var/www/intrusion     # Pfad auf dem Server
```

### SSH-Key
```bash
SERVER_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
# Hier den kompletten Inhalt deiner privaten SSH-Key-Datei einfügen
# Normalerweise aus ~/.ssh/id_rsa
-----END OPENSSH PRIVATE KEY-----
```

### Health Check
```bash
HEALTH_CHECK_URL=https://deine-domain.com/api/health
```

### Anwendungs-Secrets
```bash
DATABASE_URL=mysql://user:pass@localhost:3306/intrusion_db
JWT_SECRET=dein-super-geheimer-jwt-schlüssel
CUSTOM_KEY=dein-custom-key
```

## 🔧 SSH-Key generieren (falls noch nicht vorhanden)

```bash
# SSH-Key generieren
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Öffentlichen Key auf Server kopieren
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server.com

# Privaten Key für GitHub Actions kopieren
cat ~/.ssh/id_rsa
# Den kompletten Output in SERVER_SSH_KEY einfügen
```

## ✅ Verwendung

Nach dem Setup kannst du:

1. **Secrets aktualisieren**: Bearbeite `.env.secrets` und führe `pnpm run setup-secrets` erneut aus
2. **Neue Secrets hinzufügen**: Füge sie zu `.env.secrets` hinzu und führe das Setup-Script aus
3. **Secrets löschen**: Verwende `gh secret delete SECRET_NAME --repo owner/repo`

## 🛡️ Sicherheit

- Die `.env.secrets` Datei ist in `.gitignore` und wird nie ins Repository gepusht
- Alle Secrets werden verschlüsselt in GitHub gespeichert
- Verwende starke, eindeutige Passwörter und Keys
- Rotiere Secrets regelmäßig

## 🔍 Troubleshooting

### "GitHub CLI ist nicht installiert"
```bash
# Installiere GitHub CLI (siehe Schnellstart)
```

### "GitHub Authentication fehlgeschlagen"
```bash
gh auth login
```

### "Repository-Informationen nicht gefunden"
```bash
# Stelle sicher, dass du in einem Git-Repository bist
git remote -v
```

### "Secret konnte nicht gesetzt werden"
- Überprüfe deine GitHub-Berechtigungen
- Stelle sicher, dass du Admin-Rechte im Repository hast
- Überprüfe die Syntax in `.env.secrets` 