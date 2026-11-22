import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function apexDiskSyncPlugin() {
  const dbFile = path.resolve(__dirname, 'cars.json');
  const backupFile = path.resolve(__dirname, 'cars.backup.json');

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
