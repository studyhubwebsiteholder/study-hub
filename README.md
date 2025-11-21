# Study Hub — Upgraded Project

Files added/updated:
- `index.html`        — improved, theme toggle, accessibility, preloads
- `sw-cache.js`       — improved service worker (cache-first / network-first strategies)
- `offline.html`      — offline fallback page cached by the service worker
- `worker-proxy.js`   — optional Cloudflare Worker proxy (enables /proxy?url=...)
- `wrangler.jsonc`    — config to deploy both static assets and the worker
- `_headers`          — recommended security headers (Cloudflare Pages or adapter)

## Deploy options

### 1) Static-only (no worker proxy)
If you want just static hosting (no proxy), remove `"main"` from `wrangler.jsonc`:
```json
{
  "name":"study-hub",
  "compatibility_date":"2025-11-21",
  "assets":{"directory":"./"}
}
```
Then run:
```
npx wrangler deploy
```

### 2) Static + Worker proxy (recommended if you need a reliable proxy)
Keep `main: "worker-proxy.js"` in `wrangler.jsonc`. Deploy with:
```
npx wrangler deploy
```
This deploys a Worker that responds to `/proxy?url=ENCODED_URL`. Example:
`/proxy?url=https://example.com`

## Notes & security
- The proxy allows cross-origin fetching and sets `Access-Control-Allow-Origin: *`. Be careful about using it for sensitive or authenticated sites.
- School / corporate networks may block some targets; always test.
- Service worker caches static assets and provides an offline fallback.

If you want, I can:
- Tighten CSP and headers further
- Add a build step to minify assets
- Integrate an access-control token for the proxy
