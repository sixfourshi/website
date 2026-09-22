import http from 'http';
import fs from 'fs';
import path from 'path';

let emulatorServer: http.Server | null = null;
let startPromise: Promise<string> | null = null;

const EMULATOR_PORT = 54321;
const EMULATOR_HOST = '127.0.0.1';
const STORAGE_DIR = path.join(process.cwd(), '.supabase-storage');

/**
 * Ensures the persistent local Supabase Storage server is running on 127.0.0.1:54321.
 * Persists all objects directly to disk in .supabase-storage/
 */
export async function ensureLocalStorageServer(): Promise<string> {
  if (startPromise) {
    return startPromise;
  }

  startPromise = new Promise<string>((resolve, reject) => {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });

    // Check if a server is already listening
    const probe = http.get(`http://${EMULATOR_HOST}:${EMULATOR_PORT}/_health`, (res) => {
      res.resume();
      resolve(`http://${EMULATOR_HOST}:${EMULATOR_PORT}`);
    });

    probe.on('error', () => {
      // Not running, spin up server
      const server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url || '/', `http://${EMULATOR_HOST}:${EMULATOR_PORT}`);
          const pathname = decodeURIComponent(url.pathname);

          if (pathname === '/_health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
            return;
          }

          // GET /storage/v1/object/:bucket/*
          // (or /storage/v1/object/authenticated/:bucket/*)
          if (req.method === 'GET' && pathname.includes('/storage/v1/object/')) {
            const rel = pathname.replace(/^\/storage\/v1\/object\/(authenticated\/)?/, '');
            const filePath = path.join(STORAGE_DIR, rel);
            if (!fs.existsSync(filePath)) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ statusCode: 404, error: 'Not found', message: 'Object not found' }));
              return;
            }
            const data = fs.readFileSync(filePath);
            res.writeHead(200, {
              'Content-Type': filePath.endsWith('.json') ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
              'Content-Length': data.length,
            });
            res.end(data);
            return;
          }

          // HEAD /storage/v1/object/:bucket/*
          if (req.method === 'HEAD' && pathname.includes('/storage/v1/object/')) {
            const rel = pathname.replace(/^\/storage\/v1\/object\/(authenticated\/)?/, '');
            const filePath = path.join(STORAGE_DIR, rel);
            if (!fs.existsSync(filePath)) {
              res.writeHead(404);
              res.end();
              return;
            }
            res.writeHead(200);
            res.end();
            return;
          }

          // POST /storage/v1/object/:bucket/* (Upload/upsert object)
          if (
            req.method === 'POST' &&
            pathname.includes('/storage/v1/object/') &&
            !pathname.includes('/storage/v1/object/list/')
          ) {
            const rel = pathname.replace(/^\/storage\/v1\/object\/(authenticated\/)?/, '');
            const filePath = path.join(STORAGE_DIR, rel);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });

            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const body = Buffer.concat(chunks);
            fs.writeFileSync(filePath, body);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ Key: rel, Id: rel }));
            return;
          }

          // POST /storage/v1/object/list/:bucket (List objects)
          if (req.method === 'POST' && pathname.includes('/storage/v1/object/list/')) {
            const bucket = pathname.replace('/storage/v1/object/list/', '').replace(/\/+$/, '');
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const bodyStr = Buffer.concat(chunks).toString('utf-8');
            let body: any = {};
            try {
              if (bodyStr) body = JSON.parse(bodyStr);
            } catch {}

            const prefix = body.prefix || '';
            const dir = path.join(STORAGE_DIR, bucket, prefix);

            if (!fs.existsSync(dir)) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify([]));
              return;
            }

            const entries = fs.readdirSync(dir, { withFileTypes: true });
            const list = entries.map((entry) => {
              const fullPath = path.join(dir, entry.name);
              let size = 0;
              let mtime = new Date();
              try {
                const stat = fs.statSync(fullPath);
                size = stat.size;
                mtime = stat.mtime;
              } catch {}
              return {
                name: entry.name,
                id: entry.name,
                updated_at: mtime.toISOString(),
                created_at: mtime.toISOString(),
                last_accessed_at: mtime.toISOString(),
                metadata: { size },
              };
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(list));
            return;
          }

          // DELETE /storage/v1/object/:bucket (Remove objects)
          if (req.method === 'DELETE' && pathname.includes('/storage/v1/object/')) {
            const bucket = pathname.replace('/storage/v1/object/', '').replace(/\/+$/, '');
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const bodyStr = Buffer.concat(chunks).toString('utf-8');
            let body: any = {};
            try {
              if (bodyStr) body = JSON.parse(bodyStr);
            } catch {}

            const prefixes: string[] = body.prefixes || [];
            const deleted: { name: string }[] = [];

            for (const p of prefixes) {
              const filePath = path.join(STORAGE_DIR, bucket, p);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deleted.push({ name: p });
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(deleted));
            return;
          }

          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || 'Emulator internal error' }));
        }
      });

      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(`http://${EMULATOR_HOST}:${EMULATOR_PORT}`);
        } else {
          reject(err);
        }
      });

      server.listen(EMULATOR_PORT, EMULATOR_HOST, () => {
        emulatorServer = server;
        server.unref();
        resolve(`http://${EMULATOR_HOST}:${EMULATOR_PORT}`);
      });
    });
  });

  return startPromise;
}
