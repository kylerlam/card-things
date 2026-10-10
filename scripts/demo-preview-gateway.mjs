import http from "node:http";

const listenHost = "127.0.0.1";
const listenPort = Number(process.env.DEMO_GATEWAY_PORT ?? 3311);
const target = new URL(process.env.DEMO_GATEWAY_TARGET ?? "http://127.0.0.1:3310");
const ttlMs = Number(process.env.DEMO_GATEWAY_TTL_MS ?? 2 * 60 * 60 * 1000);

if (target.protocol !== "http:") throw new Error("DEMO_GATEWAY_TARGET must use local HTTP.");
if (!Number.isInteger(listenPort) || listenPort < 1 || listenPort > 65_535) throw new Error("Invalid DEMO_GATEWAY_PORT.");
if (!Number.isFinite(ttlMs) || ttlMs < 1) throw new Error("Invalid DEMO_GATEWAY_TTL_MS.");

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, nosnippet",
};

function isSafePath(pathname) {
  if (/%(?:2e|2f|5c)/i.test(pathname) || pathname.includes("\\")) return false;
  return (
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/user" ||
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    pathname.startsWith("/tools/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  );
}

const server = http.createServer((request, response) => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, {
      ...securityHeaders,
      Allow: "GET, HEAD",
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("This isolated preview is read-only.\n");
    return;
  }

  if (!isSafePath(url.pathname)) {
    response.writeHead(404, {
      ...securityHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Not available in the isolated Demo preview.\n");
    return;
  }

  const headers = { ...request.headers, host: target.host };
  delete headers.authorization;
  delete headers.cookie;
  delete headers["next-url"];
  delete headers["x-forwarded-for"];
  delete headers["x-forwarded-host"];
  delete headers["x-forwarded-proto"];
  delete headers.connection;
  delete headers["proxy-authorization"];
  delete headers["proxy-connection"];
  delete headers.te;
  delete headers.trailer;
  delete headers["transfer-encoding"];
  delete headers.upgrade;

  const upstream = http.request(
    {
      hostname: target.hostname,
      port: target.port,
      method,
      path: `${url.pathname}${url.search}`,
      headers,
    },
    (upstreamResponse) => {
      const responseHeaders = { ...upstreamResponse.headers };
      delete responseHeaders["set-cookie"];
      delete responseHeaders.connection;
      delete responseHeaders["keep-alive"];
      delete responseHeaders["proxy-authenticate"];
      delete responseHeaders.trailer;
      delete responseHeaders["transfer-encoding"];
      delete responseHeaders.upgrade;
      delete responseHeaders["x-powered-by"];
      delete responseHeaders.etag;
      delete responseHeaders.expires;
      responseHeaders["cache-control"] = "no-store";
      Object.assign(responseHeaders, securityHeaders);
      response.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", () => {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    response.writeHead(502, {
      ...securityHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("The local Demo preview is temporarily unavailable.\n");
  });
  request.pipe(upstream);
});

server.listen(listenPort, listenHost, () => {
  console.log(`Isolated Demo gateway listening on http://${listenHost}:${listenPort}`);
  console.log(`Allowed routes expire automatically after ${Math.round(ttlMs / 60_000)} minutes.`);
});

const expiry = setTimeout(() => {
  server.close(() => process.exit(0));
}, ttlMs);
expiry.unref();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
