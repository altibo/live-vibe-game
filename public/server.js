const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const VERSIONS_DIR = path.join(__dirname, 'versions');
const VERSION_FILE = path.join(__dirname, 'version.json');

if (!fs.existsSync(VERSIONS_DIR)) fs.mkdirSync(VERSIONS_DIR);

app.use(express.static(PUBLIC_DIR));
app.use(express.json({ limit: '10mb' }));

let currentVersion = 1;

// Load last version
if (fs.existsSync(VERSION_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    currentVersion = data.version || 1;
  } catch (e) {}
} else if (fs.existsSync(path.join(PUBLIC_DIR, 'last-change.json'))) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'last-change.json'), 'utf8'));
    currentVersion = data.version || 1;
  } catch (e) {}
}

function saveVersion() {
  fs.writeFileSync(VERSION_FILE, JSON.stringify({ version: currentVersion }));
}

function getNextVersion() {
  currentVersion++;
  saveVersion();
  return currentVersion;
}

function backupCurrentFiles(version) {
  const backupDir = path.join(VERSIONS_DIR, `v${version}`);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const files = ['game.js', 'index.html', 'style.css'];
  files.forEach(f => {
    const src = path.join(PUBLIC_DIR, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(backupDir, f));
    }
  });
}

function gitCommitAndTag(version, message) {
  exec(`git add public/ && git commit -m "v${version}: ${message}" && git tag v${version} && git push && git push --tags`, () => {});
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
        fs.writeFileSync(path.join(PUBLIC_DIR, 'last-change.json'), JSON.stringify(changeInfo));

        gitCommitAndTag(version, msg.description || 'AI update');

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
  console.log(`\nFor AI access, expose with:`);
  console.log(`  npx localtunnel --port ${PORT}`);
  console.log(`  or ngrok http ${PORT}`);
  console.log(`  or cloudflared tunnel --url http://localhost:${PORT}`);
  console.log(`\nThen give the AI the public WebSocket URL (wss://... ).`);
  console.log(`Current version: v${currentVersion}\n`);
});
