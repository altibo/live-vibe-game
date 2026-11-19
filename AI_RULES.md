# Live Vibe Game – Regeln für die KI

## Setup
- Spiel läuft im Browser (2D Canvas, kein WebGL)
- Lokaler Server auf Port 3000
- Updates kommen per WebSocket

## WebSocket-URL
Die aktuelle URL bekommst du vom User (z. B. `wss://....ngrok-free.dev`).

## Update senden
Schicke ein JSON über den WebSocket:

```json
{
  "type": "update",
  "description": "Kurze Beschreibung der Änderung",
  "files": {
    "game.js": "kompletter neuer Inhalt der Datei"
  }
}
```

- Immer den **kompletten** Inhalt der Datei schicken
- Nur Dateien schicken, die sich ändern
- `server.js` wird ins Root geschrieben, alles andere in `public/`

## Wichtige Regeln
- **Nur 2D** (Canvas). Kein Three.js / WebGL.
- Vor dem Senden Syntax prüfen (`node --check`).
- Nach erfolgreichem Update immer antworten mit:
  - Neue Versionsnummer (kommt in der Server-Antwort als `ack`)
  - Kurze Info, was geändert wurde
- Auto-Reload ist aktiv. Die Seite lädt sich von selbst neu.
- Version wird automatisch oben in die `game.js` als `const GAME_VERSION = X;` eingefügt.
- Kein Git für Spiel-Dateien. Nur WebSocket.

## Aktueller Stand
- Zwei Quader (grün + rot)
- Bewegen sich zufällig, prallen an Rändern ab
- Ziehen farbige Spuren
- Version wird unten rechts angezeigt

## Beispiel-Antwort nach Update
**v9** – Roter Quader ist jetzt größer und schneller.
