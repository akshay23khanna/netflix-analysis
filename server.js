const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dataDir = path.join(root, "data");
const publicDir = path.join(root, "public");
const port = process.env.PORT || 4180;

const typeMap = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function cleanText(value) {
  if (typeof value === "string") {
    return value
      .replace(/â€“/g, "-")
      .replace(/â€”/g, "-")
      .replace(/Ã—/g, "x")
      .replace(/â‰ˆ/g, "~")
      .replace(/â†’/g, "->")
      .replace(/Â/g, "");
  }
  if (Array.isArray(value)) return value.map(cleanText);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, cleanText(val)]));
  }
  return value;
}

function readJson(file) {
  const raw = fs.readFileSync(path.join(dataDir, file), "utf8");
  return cleanText(JSON.parse(raw));
}

const endpoints = {
  "/api/kpis": () => readJson("kpis.json"),
  "/api/eda/content-type": () => readJson("eda_content-type.json"),
  "/api/eda/ratings": () => readJson("eda_ratings.json"),
  "/api/eda/release-trends": () => readJson("eda_release-trends.json"),
  "/api/eda/top-countries": () => readJson("eda_top-countries.json"),
  "/api/genres/trends": () => readJson("genres_trends.json"),
  "/api/user-behavior/peak-hours": () => readJson("user-behavior_peak-hours.json"),
  "/api/user-behavior/retention": () => readJson("user-behavior_retention.json"),
  "/api/user-behavior/devices": () => readJson("user-behavior_devices.json"),
  "/api/recommendations/popularity-prediction": () => readJson("recommendations_popularity-prediction.json"),
  "/api/recommendations/similarity": () => readJson("recommendations_similarity.json"),
  "/api/insights": () => readJson("insights.json"),
  "/api/analysis/summary": () => {
    const kpis = readJson("kpis.json");
    const content = readJson("eda_content-type.json");
    const genres = readJson("genres_trends.json");
    const retention = readJson("user-behavior_retention.json");
    const strongestGenreMove = genres.at(-1).Documentary - genres[0].Documentary;
    const idealRuntime = retention.reduce((best, row) => (row.retention > best.retention ? row : best), retention[0]);

    return {
      headline: "Netflix catalogue strategy is shifting from raw scale to high-retention niches.",
      kpis,
      mix: content,
      modelNotes: [
        "Documentary share rose by 9 percentage points from 2014 to 2021.",
        `The retention peak appears around ${idealRuntime.episode_length_min || idealRuntime.length} minutes.`,
        "TV shows are fewer in catalogue share but create higher repeat-session potential."
      ],
      strongestGenreMove,
      recommendedActions: [
        "Double down on documentary and international TV acquisition where retention is defensible.",
        "Use 35-50 minute episode bands as the default benchmark for scripted series planning.",
        "Keep content-based recommendations explainable for cold-start discovery."
      ]
    };
  }
};

function sendJson(res, payload) {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(req.url.split("?")[0]);
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const relative = safePath === "/" || safePath === "\\" ? "index.html" : safePath.replace(/^[/\\]/, "");
  const filePath = path.join(publicDir, relative);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": typeMap[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (endpoints[pathname]) {
    try {
      sendJson(res, endpoints[pathname]());
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Unable to load analysis data" }));
    }
    return;
  }
  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`Netflix analysis dashboard running at http://localhost:${port}`);
});
