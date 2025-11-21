// Lightweight Cloudflare Worker proxy
// Deploy this as the 'main' Worker in wrangler.jsonc to enable /proxy?url=...
addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(req) {
  const url = new URL(req.url);
  if (url.pathname === '/proxy') {
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing url parameter', { status: 400 });
    try {
      // Basic validation: allow only http(s)
      if (!/^https?:\/\//i.test(target)) return new Response('Invalid target URL', { status: 400 });
      const init = {
        method: 'GET',
        headers: {
          // Pass-through commonly safe headers
          'User-Agent': req.headers.get('user-agent') || 'StudyHub-Proxy'
        }
      };
      const res = await fetch(target, init);
      // Create a new response to control CORS & security
      const headers = new Headers(res.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('X-Proxy-By', 'StudyHub-Worker');
      // Prevent caching of sensitive responses by default
      headers.set('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
      return new Response(res.body, { status: res.status, headers });
    } catch (err) {
      return new Response('Upstream fetch failed: ' + String(err), { status: 502 });
    }
  }

  // For any other request, return the static asset from KV/Assets if configured by wrangler.
  return fetch(req);
}
