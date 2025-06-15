# 🕵️‍♂️ HackerAdventure INTRUSION – Hacker Adventure Game

**INTRUSION** ist ein webbasiertes Fullstack-Hacker-Adventure-Game, entwickelt mit **Next.js** und **MariaDB**. Spieler:innen tauchen ein in eine storybasierte Welt aus Code, Rätseln und Sicherheitsmechanismen. Das Spiel kombiniert Point-&-Click-Mechaniken, Terminal-Eingaben und Drag-&-Drop-Logik.

---

## 🎯 Ziel des Projekts

- Entwicklung eines modularen Hacker-Spiels mit realitätsnaher Rätselmechanik
- Vollständige Trennung von Spielinhalten (Missionen, Räume, Rätsel) und Code
- Umsetzung eines Admin-Editors zur Pflege von Spielinhalten
- DSGVO-konforme Speicherung und sichere Authentifizierung via JWT
- Automatisiertes CI/CD mit GitHub Actions

---

## ⚙️ Technologie-Stack

| Bereich      | Technologie         |
|-------------|---------------------|
| Frontend    | Next.js (React, App Router, TypeScript) |
| Backend     | Next.js API Routes (Node.js) |
| Datenbank   | MariaDB (mysql2)     |
| Authentifizierung | JWT + optional OAuth |
| Admin-Editor| Webbasierte UI (Next.js) |
| Testing     | Jest, React Testing Library, Supertest |
| CI/CD       | GitHub Actions       |
| Deployment  | Selfhosted    |

---

## 🧩 Features

### 🔐 Authentifizierung
- Registrierung & Login via Username/Passwort (JWT-basiert)
- Kein E-Mail erforderlich
- Admin-Rolle über Datenbank steuerbar

### 🧠 Spielmechanik
- Modularer Aufbau (Missionen, Räume, Objekte, Rätsel)
- Rätseltypen: Multiple Choice, Codeeingabe, Terminal
- Drag-&-Drop für Item-Anwendungen
- Automatisches Speichern des Spielfortschritts
- Spielstand-Resume und Session-Handling

### 🎛️ Admin-Editor
- Erstellung und Bearbeitung von Missionen, Räumen, Objekten, Rätseln
- Speicherung aller Spielinhalte direkt in MariaDB
- Kein hartcodierter Content

---

## 📦 Datenbankmodell

Die SQL-Struktur ist vollständig in der Datei `intrusion_schema.sql` dokumentiert und enthält:
- `users`, `missions`, `rooms`, `objects`, `items`, `puzzles`, `user_items`, `user_puzzles`, `user_progress`

> Beispiel-Daten zum Testen sind bereits enthalten!

---

## ▶️ Lokale Entwicklung

### 🔧 Voraussetzungen
- Node.js (v18+ empfohlen)
- MariaDB Server
- `.env.local` Datei mit:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=deinpasswort
DB_NAME=intrusion
JWT_SECRET=dein_supergeheimer_schlüssel
