# Live Vibe Game

Browser-basiertes Spiel mit Hot-Reload über WebSocket, State-Persistenz, Live-Diff und optionalem GitHub-Versioning.

## Setup auf dem Zielrechner

```bash
git clone https://github.com/altibo/live-vibe-game.git
cd live-vibe-game
npm install
npm start
```

Das Script gibt dir aus:
- Game-URL: http://localhost:3000
- WebSocket: ws://localhost:3000

## Für die KI freigeben (Tunnel)

```bash
npx localtunnel --port 3000
# oder
ngrok http 3000
```

Den öffentlichen Link (z. B. `https://xyz.loca.lt`) an die KI geben.  
Die KI muss dann per WebSocket (`wss://xyz.loca.lt`) Updates schicken.

## Update-Format (was die KI schicken soll)

```json
{
  "type": "update",
  "description": "Schwerkraft reduziert, neue Plattform",
  "files": {
    "game.js": "// kompletter neuer Inhalt von game.js",
    "index.html": "..."
  }
}
```

## Features
- State wird in localStorage gespeichert und nach Reload wiederhergestellt
- Live-Diff Overlay zeigt die Änderungsbeschreibung
- Versionsnummer unten rechts
- Automatische lokale Backups in `versions/`
- Optional: Git commit + tag + push bei jedem Update (wenn Git-Credentials vorhanden)

## GitHub-Versionierung

Das Spiel selbst liegt in diesem Repo unter `public/`.  
Bei jedem Update macht der Server (wenn möglich) einen Commit + Tag `vXX` und pusht.  
So hast du volle History und Rollback über Git.
