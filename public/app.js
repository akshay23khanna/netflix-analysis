const api = (path) => fetch(path).then((response) => response.json());
const money = new Intl.NumberFormat("en-US");

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

function renderKpis(kpis) {
  const cards = [
    ["Total titles", money.format(kpis.total_titles)],
    ["Movies", money.format(kpis.movies)],
    ["TV shows", money.format(kpis.tv_shows)],
    ["Avg movie duration", `${kpis.avg_movie_duration_min} min`],
    ["Top genre", kpis.top_genre],
    ["Data window", kpis.data_window]
  ];
  document.getElementById("kpiGrid").innerHTML = cards
    .map(([label, value]) => `<div class="kpi"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function renderContentMix(data) {
  const wrap = document.getElementById("contentChart");
  wrap.innerHTML = `<div class="donut" aria-hidden="true"></div><div>${data
    .map(
      (item, index) =>
        `<div class="legend-row"><i class="swatch ${index ? "dark" : ""}"></i><strong>${item.name}</strong><span>${item.share}%</span></div>`
    )
    .join("")}</div>`;
}

function renderBars(id, data, nameKey, valueKey, maxOverride) {
  const max = maxOverride || Math.max(...data.map((row) => row[valueKey]));
  document.getElementById(id).innerHTML = data
    .map((row) => {
      const value = row[valueKey];
      const width = Math.max(3, (value / max) * 100);
      return `<div class="bar-row"><strong>${row[nameKey]}</strong><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><span>${value}</span></div>`;
    })
    .join("");
}

function renderLine(id, data, keys, colors) {
  const w = 760;
  const h = 260;
  const pad = 34;
  const max = Math.max(...data.flatMap((row) => keys.map((key) => row[key])));
  const minX = data[0].year || data[0].length;
  const maxX = data.at(-1).year || data.at(-1).length;
  const xValue = (row) => row.year || row.length;
  const x = (value) => pad + ((value - minX) / (maxX - minX)) * (w - pad * 2);
  const y = (value) => h - pad - (value / max) * (h - pad * 2);
  const lines = keys
    .map((key, index) => {
      const points = data.map((row) => `${x(xValue(row))},${y(row[key])}`).join(" ");
      return `<polyline points="${points}" fill="none" stroke="${colors[index]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join("");
  const dots = keys
    .flatMap((key, index) =>
      data.map((row) => `<circle cx="${x(xValue(row))}" cy="${y(row[key])}" r="3.5" fill="${colors[index]}"/>`)
    )
    .join("");
  const labels = data
    .filter((_, index) => index % Math.ceil(data.length / 7) === 0)
    .map((row) => `<text x="${x(xValue(row))}" y="${h - 6}" text-anchor="middle" font-size="12">${xValue(row)}</text>`)
    .join("");
  document.getElementById(id).innerHTML = `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img">${labels}${lines}${dots}</svg>`;
}

function renderGenreStack(data) {
  const keys = ["Drama", "Comedy", "Documentary", "Action & Adventure", "International TV", "Thriller", "Romance", "Sci-Fi & Fantasy"];
  const colors = ["#e50914", "#191817", "#d8aa45", "#17856a", "#7e4f9e", "#476a8f", "#c6537a", "#6c6f77"];
  const w = 980;
  const h = 360;
  const pad = 42;
  const band = (w - pad * 2) / data.length;
  const bars = data
    .map((row, rowIndex) => {
      let yStart = h - pad;
      return keys
        .map((key, keyIndex) => {
          const height = (row[key] / 100) * (h - pad * 2);
          yStart -= height;
          return `<rect x="${pad + rowIndex * band + 6}" y="${yStart}" width="${band - 12}" height="${height}" fill="${colors[keyIndex]}"><title>${row.year} ${key}: ${row[key]}%</title></rect>`;
        })
        .join("");
    })
    .join("");
  const labels = data
    .map((row, index) => `<text x="${pad + index * band + band / 2}" y="${h - 10}" text-anchor="middle" font-size="12">${row.year}</text>`)
    .join("");
  const legend = keys
    .map((key, index) => `<span style="--dot:${colors[index]}"><i></i>${key}</span>`)
    .join("");
  document.getElementById("genreChart").innerHTML = `<div class="mini-legend">${legend}</div><svg class="chart-svg" viewBox="0 0 ${w} ${h}">${bars}${labels}</svg>`;
}

function renderHeatmap(data) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const html = ['<div class="heatmap-grid"><span></span>'];
  for (let hour = 0; hour < 24; hour += 1) html.push(`<span class="heat-label">${hour}</span>`);
  days.forEach((day) => {
    html.push(`<span class="heat-label">${day}</span>`);
    for (let hour = 0; hour < 24; hour += 1) {
      const row = data.find((item) => item.day === day && item.hour === hour);
      const value = row ? row.intensity : 0;
      html.push(`<span class="heat-cell" style="--alpha:${Math.max(0.06, value / 100)}" title="${day} ${hour}:00 - ${value}"></span>`);
    }
  });
  html.push("</div>");
  document.getElementById("heatmap").innerHTML = html.join("");
}

function renderRetention(data) {
  const averageByLength = Object.values(
    data.reduce((acc, row) => {
      acc[row.length] ||= { length: row.length, retention: 0, count: 0 };
      acc[row.length].retention += row.retention;
      acc[row.length].count += 1;
      return acc;
    }, {})
  )
    .map((row) => ({ length: row.length, retention: +(row.retention / row.count).toFixed(1) }))
    .sort((a, b) => a.length - b.length);
  renderLine("retentionChart", averageByLength, ["retention"], ["#e50914"]);
}

function renderSimilarity(data) {
  document.getElementById("similarityList").innerHTML = data
    .map(
      (row) =>
        `<div class="score-row"><strong>${row.title}</strong><span>${row.similarity.toFixed(2)}</span><div class="score-meter"><div style="width:${row.similarity * 100}%"></div></div></div>`
    )
    .join("");
}

function renderScatter(data) {
  const w = 620;
  const h = 320;
  const pad = 38;
  const x = (value) => pad + (value / 100) * (w - pad * 2);
  const y = (value) => h - pad - (value / 100) * (h - pad * 2);
  const points = data.points
    .map((row) => `<circle cx="${x(row.actual)}" cy="${y(row.predicted)}" r="4" fill="#e50914" opacity="0.68"><title>Actual ${row.actual}, predicted ${row.predicted}</title></circle>`)
    .join("");
  document.getElementById("predictionChart").innerHTML = `<svg class="chart-svg" viewBox="0 0 ${w} ${h}"><line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${pad}" stroke="#191817" stroke-dasharray="6 6"/><text x="${pad}" y="20">R2 ${data.r_squared} | MAE ${data.mae} | RMSE ${data.rmse}</text>${points}</svg>`;
}

function renderCountries(data) {
  document.getElementById("countryList").innerHTML = data
    .map((row, index) => `<div class="rank-row"><span>${String(index + 1).padStart(2, "0")}</span><strong>${row.country}</strong><b>${money.format(row.titles)}</b></div>`)
    .join("");
}

function renderNotes(summary) {
  document.getElementById("modelNotes").innerHTML = summary.recommendedActions
    .map((item, index) => `<div class="note-card"><span>Action ${index + 1}</span><p>${item}</p></div>`)
    .join("");
}

function renderInsights(data) {
  document.getElementById("insightCards").innerHTML = data
    .map((item, index) => `<article><strong>Insight ${String(index + 1).padStart(2, "0")}</strong><h3>${item.headline}</h3><p>${item.detail}</p></article>`)
    .join("");
}

async function init() {
  const [kpis, content, ratings, releases, countries, genres, peakHours, devices, retention, similarity, prediction, insights, summary] =
    await Promise.all([
      api("/api/kpis"),
      api("/api/eda/content-type"),
      api("/api/eda/ratings"),
      api("/api/eda/release-trends"),
      api("/api/eda/top-countries"),
      api("/api/genres/trends"),
      api("/api/user-behavior/peak-hours"),
      api("/api/user-behavior/devices"),
      api("/api/user-behavior/retention"),
      api("/api/recommendations/similarity"),
      api("/api/recommendations/popularity-prediction"),
      api("/api/insights"),
      api("/api/analysis/summary")
    ]);

  renderKpis(kpis);
  renderContentMix(content);
  renderBars("ratingsChart", ratings, "rating", "count");
  renderLine("releaseChart", releases, ["movies", "tv_shows"], ["#e50914", "#191817"]);
  renderCountries(countries);
  renderGenreStack(genres);
  renderHeatmap(peakHours);
  renderBars("deviceChart", devices, "device", "share", 50);
  renderRetention(retention);
  renderSimilarity(similarity);
  renderScatter(prediction);
  renderNotes(summary);
  renderInsights(insights);
}

init().catch((error) => {
  document.body.prepend(el("div", "load-error", `Unable to load dashboard data: ${error.message}`));
});
