# Deployment

ORION Sentinel AI is a static, client-rendered application. Anything that serves
`dist/` over HTTP(S) will run it. This document covers the supported paths:
static hosting, Nginx, and Docker.

## Build requirements

- Node.js ≥ 20, npm ≥ 10
- No server-side runtime is required at production time

```bash
npm ci --omit=dev     # install exact versions, production deps only
npm run build         # outputs to dist/
```

`npm ci` requires a lockfile — `package-lock.json` is committed.

## Static hosting

The output of `npm run build` is fully static. Deploy `dist/` to:

- **Netlify / Vercel / Cloudflare Pages**: point the build command at
  `npm run build` and the publish directory at `dist`.
- **GitHub Pages**: use the official `actions/deploy-pages` workflow; no
  special base-path config is needed because the app uses relative asset paths.
- **S3 / GCS / Azure Blob**: sync `dist/` and enable static website hosting.
- **Any web server**: copy `dist/` to the web root.

### Server config for SPA fallback

This app is a single page with no client-side routes, so a simple
`try_files`-style fallback is enough. If you later add router URLs, map unknown
paths to `/index.html`.

## Nginx

A tuned configuration is included at [`nginx.conf`](../nginx.conf). Build and
serve:

```bash
npm ci --omit=dev
npm run build
sudo cp -r dist/* /var/www/orion/
sudo cp nginx.conf /etc/nginx/sites-available/orion
```

The config provides:

- `gzip` for JSON/CSS/JS with Vary headers
- Aggressive long-term caching of immutable hashed assets (`max-age=31536000, immutable`)
- `no-cache` for `index.html` so releases never serve stale shells
- Cache-busting for the service-worker entry point

## Docker

Two files are included:

- **`Dockerfile`** — multi-stage: `node:22-alpine` builds, `nginx:alpine` serves.
- **`docker-compose.yml`** — one-command local deployment on port 8080.

```bash
docker compose up --build
# open http://localhost:8080
```

The Nginx image picks up `nginx.conf`, the gzip/caching profile, and a
`daemon off` entrypoint. The image is rootless-friendly — the container runs as
`nginx` user with only the web root mounted.

### Custom ports

```bash
docker build -t orion-sentinel-ai .
docker run -d -p 9000:80 --name orion orion-sentinel-ai
```

## Security hardening

- **HTTPS everywhere.** Terminate TLS at the edge (Caddy, Traefik, Cloudflare,
  or the platform's managed TLS). HSTS is left to the edge layer.
- **Security headers.** Use the edge platform's header controls; the reference
  set is listed in [security.md](security.md).
- **Content Security Policy.** Add a CSP restricting `default-src 'self'`;
  WebGL and WebGL2 are unaffected, and the app loads no remote scripts, fonts,
  or images by default. The dev server needs `ws:` for HMR.
- **Read-only runtime.** No storage, no cookies, no server endpoints — the
  container needs no writable volumes and no network egress.

## Verifying a deployment

```bash
curl -I https://your-host.example/          # expect 200
curl -s https://your-host.example/ | head   # expect the ORION <title>
docker compose up --build && curl -I localhost:8080
```

Then confirm in a browser that the globe renders and the scanner starts
streaming events.
