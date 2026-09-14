var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var PORT = 3e3;
function parsePortHtml(html) {
  const entries = [];
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
  if (entries.length === 0) {
    const fallbackRegex = /([a-zA-Z0-9_-]+)[\s\S]*?(?:href=['"]([^'"]+)['"])?[\s\S]*?(\d{4,5})/g;
    let fbMatch;
    while ((fbMatch = fallbackRegex.exec(html)) !== null) {
      const name = fbMatch[1];
      const url = fbMatch[2];
      const port = parseInt(fbMatch[3], 10);
      if (name && !isNaN(port) && port > 1e3 && port <= 65535) {
        entries.push({ name, port, url });
      }
    }
  }
  return entries;
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json());
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });
  app.all("/api/port-sync", async (req, res) => {
    try {
      const targetUrl = req.query.url || req.body && req.body.url || "http://lac.hesip.top:8080/port";
      const targetService = req.query.service || req.body && req.body.service || "emby-nginx";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8e3);
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Yamby-Web-Client/1.0",
          Accept: "text/html,application/xhtml+xml,application/json,*/*"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        return res.status(502).json({
          success: false,
          error: `Failed to fetch port page. Remote HTTP status: ${response.status}`,
          targetUrl
        });
      }
      const text = await response.text();
      let entries = [];
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          entries = json.map((item) => ({
            name: item.name || item.service || item.id,
            port: parseInt(item.port, 10),
            ip: item.ip || item.host,
            url: item.url,
            time: item.time || item.updatedAt
          })).filter((e) => e.name && !isNaN(e.port));
        } else if (typeof json === "object" && json !== null) {
          for (const [k, v] of Object.entries(json)) {
            const portNum = typeof v === "number" ? v : parseInt(String(v), 10);
            if (!isNaN(portNum)) {
              entries.push({ name: k, port: portNum });
            }
          }
        }
      } catch {
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
          rawPreview: text.slice(0, 300)
        });
      }
      let extractedHost = "";
      if (matched.url) {
        try {
          const parsed = new URL(matched.url);
          extractedHost = parsed.hostname;
        } catch {
        }
      }
      return res.json({
        success: true,
        service: matched.name,
        port: matched.port,
        ip: matched.ip,
        host: extractedHost || matched.ip,
        resolvedUrl: matched.url || `http://${matched.ip || "localhost"}:${matched.port}`,
        updatedAt: matched.time || (/* @__PURE__ */ new Date()).toISOString(),
        allEntries: entries
      });
    } catch (err) {
      console.error("Port sync error:", err);
      return res.status(500).json({
        success: false,
        error: err.name === "AbortError" ? "Request to port URL timed out (8s)" : err.message || "Failed to resolve port"
      });
    }
  });
  app.all("/api/emby-proxy", async (req, res) => {
    try {
      const targetServer = req.headers["x-target-server"] || req.query.server;
      const targetPath = req.headers["x-target-path"] || req.query.path || "";
      const rawTargetUrl = req.query.url;
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
      const forwardHeaders = {
        "User-Agent": "Yamby-Web/1.0 (Mozilla/5.0)",
        Accept: req.headers.accept || "*/*"
      };
      if (req.headers["x-emby-token"]) {
        forwardHeaders["X-Emby-Token"] = req.headers["x-emby-token"];
      }
      if (req.headers["x-emby-authorization"]) {
        forwardHeaders["X-Emby-Authorization"] = req.headers["x-emby-authorization"];
      }
      if (req.headers.range) {
        forwardHeaders["Range"] = req.headers.range;
      }
      if (req.headers["content-type"]) {
        forwardHeaders["Content-Type"] = req.headers["content-type"];
      }
      const fetchOptions = {
        method: req.method,
        headers: forwardHeaders
      };
      if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
      const remoteRes = await fetch(finalUrl, fetchOptions);
      res.status(remoteRes.status);
      remoteRes.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (lower === "content-type" || lower === "content-length" || lower === "content-range" || lower === "accept-ranges" || lower === "etag" || lower === "last-modified") {
          res.setHeader(key, value);
        }
      });
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      if (!remoteRes.body) {
        return res.end();
      }
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
    } catch (err) {
      console.error("Emby proxy error:", err);
      if (!res.headersSent) {
        res.status(502).json({ error: err.message || "Proxy connection failed" });
      }
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Yamby server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
