import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

interface ServiceEntry {
  time?: string;
  name: string;
  ip?: string;
  port: number;
  url?: string;
}

function parsePortHtml(html: string): ServiceEntry[] {
  const entries: ServiceEntry[] = [];
  // Match each table row
  const rowRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(?:<a[^>]*href=['"]([^'"]+)['"][^>]*>)?(\d+)(?:<\/a>)?<\/td>\s*<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const time = match[1]?.trim();
    const name = match[2]?.trim();
    const ip = match[3]?.trim();
    const url = match[4]?.trim();
    const port = parseInt(match[5]?.trim(), 10);
    if (name && !isNaN(port)) {
      entries.push({ time, name, ip, port, url });
    }
  }

  // Fallback regex if table structure slightly differs
  if (entries.length === 0) {
    const fallbackRegex = /([a-zA-Z0-9_-]+)[\s\S]*?(?:href=['"]([^'"]+)['"])?[\s\S]*?(\d{4,5})/g;
    let fbMatch;
    while ((fbMatch = fallbackRegex.exec(html)) !== null) {
      const name = fbMatch[1];
      const url = fbMatch[2];
      const port = parseInt(fbMatch[3], 10);
      if (name && !isNaN(port) && port > 1000 && port <= 65535) {
        entries.push({ name, port, url });
      }
    }
  }

  return entries;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Dynamic Port Sync API
  // Supports fetching from e.g. http://lac.hesip.top:8080/port
  app.all("/api/port-sync", async (req, res) => {
    try {
      const targetUrl = (req.query.url as string) || (req.body && req.body.url) || "http://lac.hesip.top:8080/port";
      const targetService = (req.query.service as string) || (req.body && req.body.service) || "emby-nginx";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Yamby-Web-Client/1.0",
          Accept: "text/html,application/xhtml+xml,application/json,*/*",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          error: `Failed to fetch port page. Remote HTTP status: ${response.status}`,
          targetUrl,
        });
      }

      const text = await response.text();
      let entries: ServiceEntry[] = [];

      try {
        // Try JSON parsing first
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          entries = json.map((item) => ({
            name: item.name || item.service || item.id,
            port: parseInt(item.port, 10),
            ip: item.ip || item.host,
            url: item.url,
            time: item.time || item.updatedAt,
          })).filter(e => e.name && !isNaN(e.port));
        } else if (typeof json === "object" && json !== null) {
          for (const [k, v] of Object.entries(json)) {
            const portNum = typeof v === "number" ? v : parseInt(String(v), 10);
            if (!isNaN(portNum)) {
              entries.push({ name: k, port: portNum });
            }
          }
        }
      } catch {
        // Not JSON, parse HTML table
        entries = parsePortHtml(text);
      }

      const matched = entries.find(
        (e) => e.name.toLowerCase() === targetService.toLowerCase()
      ) || entries.find(
        (e) => e.name.toLowerCase().includes(targetService.toLowerCase())
      );

      if (!matched) {
        return res.json({
          success: false,
          error: `Service "${targetService}" not found in port list.`,
          allEntries: entries,
          rawPreview: text.slice(0, 300),
        });
      }

      // Extract domain/host from matched.url if present
      let extractedHost = "";
      if (matched.url) {
        try {
          const parsed = new URL(matched.url);
          extractedHost = parsed.hostname;
        } catch {}
      }

      return res.json({
        success: true,
        service: matched.name,
        port: matched.port,
        ip: matched.ip,
        host: extractedHost || matched.ip,
        resolvedUrl: matched.url || `http://${matched.ip || "localhost"}:${matched.port}`,
        updatedAt: matched.time || new Date().toISOString(),
        allEntries: entries,
      });
    } catch (err: any) {
      console.error("Port sync error:", err);
      return res.status(500).json({
        success: false,
        error: err.name === "AbortError" ? "Request to port URL timed out (8s)" : (err.message || "Failed to resolve port"),
      });
    }
  });

  // Emby Proxy API
  // Bypasses browser Mixed Content (HTTPS -> HTTP) and CORS issues
  app.all("/api/emby-proxy", async (req, res) => {
    try {
      const targetServer = (req.headers["x-target-server"] as string) || (req.query.server as string);
      const targetPath = (req.headers["x-target-path"] as string) || (req.query.path as string) || "";
      const rawTargetUrl = (req.query.url as string);

      let finalUrl = "";
      if (rawTargetUrl) {
        finalUrl = rawTargetUrl;
      } else if (targetServer) {
        const cleanServer = targetServer.replace(/\/+$/, "");
        const cleanPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
        finalUrl = `${cleanServer}${cleanPath}`;
      } else {
        return res.status(400).json({ error: "Missing x-target-server or url parameter" });
      }

      const forwardHeaders: Record<string, string> = {
        "User-Agent": "Yamby-Web/1.0 (Mozilla/5.0)",
        Accept: req.headers.accept || "*/*",
      };

      if (req.headers["x-emby-token"]) {
        forwardHeaders["X-Emby-Token"] = req.headers["x-emby-token"] as string;
      }
      if (req.headers["x-emby-authorization"]) {
        forwardHeaders["X-Emby-Authorization"] = req.headers["x-emby-authorization"] as string;
      }
      if (req.headers.range) {
        forwardHeaders["Range"] = req.headers.range;
      }
      if (req.headers["content-type"]) {
        forwardHeaders["Content-Type"] = req.headers["content-type"];
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers: forwardHeaders,
      };

      if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const remoteRes = await fetch(finalUrl, fetchOptions);

      // Copy response headers
      res.status(remoteRes.status);
      remoteRes.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (
          lower === "content-type" ||
          lower === "content-length" ||
          lower === "content-range" ||
          lower === "accept-ranges" ||
          lower === "etag" ||
          lower === "last-modified"
        ) {
          res.setHeader(key, value);
        }
      });

      // Enable CORS for frontend
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");

      if (!remoteRes.body) {
        return res.end();
      }

      // Stream data to client (supports video chunks)
      const reader = remoteRes.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      };

      pump().catch((err) => {
        console.error("Stream pump error:", err);
        res.end();
      });
    } catch (err: any) {
      console.error("Emby proxy error:", err);
      if (!res.headersSent) {
        res.status(502).json({ error: err.message || "Proxy connection failed" });
      }
    }
  });

  // Vite development or production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Yamby server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
