// Subliminate fetch trap.
//
// Intercepts every fetch from the page. Same-origin static assets pass
// through; everything else is BLOCKED. The block + log pair is what
// makes the Network Activity panel's "0" counter falsifiable: if any
// JS in the bundle tries to call out, this worker stops it before the
// browser issues the request, and the attempt is logged for the user.
//
// The CSP (meta tag in index.html) already enforces `connect-src 'none'`
// at the browser level, so this worker is belt-and-suspenders. It also
// gives us a place to surface attempts visually — CSP violations only
// land in the console, not the UI.
//
// Broadcasts log entries on the 'subliminate-network' channel. Main-
// thread clients subscribe via BroadcastChannel.

const CHANNEL = 'subliminate-network';
const SW_VERSION = 'v1';

let channel = null;
function getChannel() {
  if (!channel) channel = new BroadcastChannel(CHANNEL);
  return channel;
}

function publish(message) {
  try {
    getChannel().postMessage(message);
  } catch {
    // BroadcastChannel can throw if the worker is mid-shutdown. The log
    // entry is best-effort; the block itself already happened.
  }
}

self.addEventListener('install', (event) => {
  // Activate immediately so the trap is live on the first page load.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  publish({ kind: 'sw-ready', version: SW_VERSION, at: Date.now() });
});

function isSelfOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isAllowedScheme(url) {
  // data: and blob: are page-local and required for CSV export and
  // SVG icon rendering. These are not cross-origin reads.
  return url.startsWith('data:') || url.startsWith('blob:');
}

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (isSelfOrigin(url) || isAllowedScheme(url)) {
    publish({
      kind: 'request',
      url,
      method: event.request.method,
      status: 'allowed',
      destination: event.request.destination,
      at: Date.now(),
    });
    // Default browser fetch — don't call respondWith so the network
    // path stays normal.
    return;
  }

  // Cross-origin attempt. Block it and broadcast the attempt so the
  // user sees it.
  publish({
    kind: 'request',
    url,
    method: event.request.method,
    status: 'blocked',
    destination: event.request.destination,
    at: Date.now(),
  });
  event.respondWith(
    new Response(null, {
      status: 403,
      statusText: 'Blocked by Subliminate fetch trap',
      headers: { 'X-Subliminate-Block': '1' },
    }),
  );
});

// Heartbeat: clients can ask the SW to confirm it's alive and listening.
self.addEventListener('message', (event) => {
  if (event.data?.kind === 'ping') {
    publish({ kind: 'pong', version: SW_VERSION, at: Date.now() });
  }
});
