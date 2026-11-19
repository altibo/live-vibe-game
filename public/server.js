const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const VERSIONS_DIR = path.join(__dirname, 'versions');
const VERSION_FILE = path.join(__dirname, 'version.json');

if (!fs.existsSync(VERSIONS_DIR)) fs.mkdirSync(VERSIONS_DIR, { recursive: true });

app.use(express.static(PUBLIC_DIR));
app.use(express.json({ limit: '10mb' }));

let currentVersion = 1;

function loadVersion() {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
      if (data && typeof data.version === 'number') return data.version;
    }
  } catch (e) {}
  try {
    const lastChange = path.join(PUBLIC_DIR, 'last-change.json');
    if (fs.existsSync(lastChange)) {
      const data = JSON.parse(fs.readFileSync(lastChange, 'utf8'));
      if (data && typeof data.version === 'number') return data.version;
    }
  } catch (e) {}
  return 1;
}

currentVersion = loadVersion();

function saveVersion() {
  try {
    fs.writeFileSync(VERSION_FILE, JSON.stringify({ version: currentVersion }, null, 2));
  } catch (e) {}
}

function getNextVersion() {
  currentVersion++;
  saveVersion();
  return currentVersion;
}

function backupCurrentFiles(version) {
  try {
    const backupDir = path.join(VERSIONS_DIR, `v${version}`);
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    ['game.js', 'index.html', 'style.css'].forEach(f => {
      const src = path.join(PUBLIC_DIR, f);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(backupDir, f));
    });
  } catch (e) {}
}

wss.on('connection', (ws) => {
  console.log('AI or client connected');
  ws.send(JSON.stringify({ type: 'ready', version: currentVersion }));

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'update') {
        const version = getNextVersion();
        console.log(`Received update for v${version}`);

        backupCurrentFiles(version - 1);

        if (msg.files) {
          for (const [filename, content] of Object.entries(msg.files)) {
            const filePath = path.join(PUBLIC_DIR, filename);
            fs.writeFileSync(filePath, content);
            console.log('Wrote', filename);
          }
        }

        const changeInfo = {
          version,
          description: msg.description || 'Updated by AI',
          timestamp: Date.now()
        };
        fs.writeFileSync(path.join(PUBLIC_DIR, 'last-change.json'), JSON.stringify(changeInfo, null, 2));

        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'reload', version, description: changeInfo.description }));
          }
        });

        ws.send(JSON.stringify({ type: 'ack', version }));
      }
    } catch (e) {
      console.error(e);
      ws.send(JSON.stringify({ type: 'error', message: e.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n=== Live Vibe Game ===`);
  console.log(`Game:     http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`\nCurrent version: v${currentVersion}\n`);
});
