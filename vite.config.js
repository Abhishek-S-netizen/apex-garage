import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function apexDiskSyncPlugin() {
  const dbFile = path.resolve(__dirname, 'cars.json');
  const backupFile = path.resolve(__dirname, 'cars.backup.json');
  const publicDir = path.resolve(__dirname, 'public');
  const artifactIconPath = 'C:/Users/Acer/.gemini/antigravity-ide/brain/d246175c-8bf3-401b-a37a-fa3611fda7b5/apex_chevron_icon_1791726220671.jpg';

  // Automatically ensure PWA PNG icon files are present in public directory
  if (fs.existsSync(artifactIconPath) && fs.existsSync(publicDir)) {
    try {
      const icon512 = path.join(publicDir, 'icon-512.png');
      const icon192 = path.join(publicDir, 'icon-192.png');
      const appleTouch = path.join(publicDir, 'apple-touch-icon.png');
      const favicon = path.join(publicDir, 'favicon.png');

      if (!fs.existsSync(icon512)) fs.copyFileSync(artifactIconPath, icon512);
      if (!fs.existsSync(icon192)) fs.copyFileSync(artifactIconPath, icon192);
      if (!fs.existsSync(appleTouch)) fs.copyFileSync(artifactIconPath, appleTouch);
      if (!fs.existsSync(favicon)) fs.copyFileSync(artifactIconPath, favicon);
    } catch (e) {
      console.warn('[APEX Icons] Notice:', e.message);
    }
  }

  return {
    name: 'apex-disk-sync',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0];
        if (url === '/api/data') {
          if (req.method === 'GET') {
            if (fs.existsSync(dbFile)) {
              try {
                const data = fs.readFileSync(dbFile, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-cache');
                res.end(data);
                return;
              } catch (e) {
                console.error('[APEX Sync] Error reading cars.json:', e);
              }
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ exists: false }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf-8');
                fs.writeFileSync(backupFile, JSON.stringify(parsed, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
              } catch (err) {
                console.error('[APEX Sync] Error saving cars.json:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apexDiskSyncPlugin()],
  server: {
    port: 5173,
    open: false
  }
});
