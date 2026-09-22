(() => {
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const number = (value) => Number(value ?? 0).toLocaleString("en-US");

  function sourceStatus(source, target) {
    const badge = byId(target);
    badge.textContent = source.status === "ok" ? "OK" : "Error";
    badge.className = `badge ${source.status}`;
  }

  function render(report) {
    byId("status").textContent = "Data loaded";
    byId("period").textContent = `Period: ${report.startDate} to ${report.endDate}`;
    byId("checked").textContent = `Checked: ${new Date(report.checkedAt).toLocaleString()}`;
    sourceStatus(report.searchConsole, "search-status");
    sourceStatus(report.analytics, "analytics-status");

    const search = report.searchConsole.data;
    const analytics = report.analytics.data;
    const searchClicks = search?.rows?.reduce((sum, row) => sum + Number(row.clicks || 0), 0) ?? 0;
    const searchImpressions = search?.rows?.reduce((sum, row) => sum + Number(row.impressions || 0), 0) ?? 0;
    const cards = analytics ? [
      ["Active users", number(analytics.summary.activeUsers)],
      ["Sessions", number(analytics.summary.sessions)],
      ["Page views", number(analytics.summary.screenPageViews)],
      ["Watched clicks", number(searchClicks)],
      ["Watched impressions", number(searchImpressions)],
      ["Queries with data", number(search?.rows?.length ?? 0)],
    ] : [];
    byId("summary-cards").innerHTML = cards.map(([label, value]) => `<article class="card"><div class="card-label">${label}</div><div class="card-value">${value}</div></article>`).join("");

    if (report.searchConsole.status === "error") {
      byId("search-content").innerHTML = `<p class="error">${escapeHtml(report.searchConsole.error || "Search Console error")}</p>`;
    } else {
      const rows = search?.rows || [];
      byId("search-content").innerHTML = rows.length ? `<table><thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.query)}</td><td>${number(row.clicks)}</td><td>${number(row.impressions)}</td><td>${(Number(row.ctr) * 100).toFixed(2)}%</td><td>${Number(row.position).toFixed(2)}</td></tr>`).join("")}</tbody></table>` : "No watched queries had data in this period.";
    }

    if (report.analytics.status === "error") {
      byId("pages-content").innerHTML = `<p class="error">${escapeHtml(report.analytics.error || "Analytics error")}</p>`;
    } else {
      const pages = analytics?.topPages || [];
      byId("pages-content").innerHTML = pages.length ? `<table><thead><tr><th>Page</th><th>Users</th><th>Sessions</th><th>Views</th></tr></thead><tbody>${pages.map((page) => `<tr><td>${escapeHtml(page.pagePath)}</td><td>${number(page.activeUsers)}</td><td>${number(page.sessions)}</td><td>${number(page.screenPageViews)}</td></tr>`).join("")}</tbody></table>` : "No page rows had data in this period.";
    }
  }

  async function load() {
    byId("status").textContent = "Loading...";
    try {
      const response = await fetch("/api/analytics-monitor", { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`Request failed: HTTP ${response.status}`);
      render(await response.json());
    } catch (error) {
      byId("status").textContent = error instanceof Error ? error.message : "Panel request failed";
    }
  }

  byId("refresh").addEventListener("click", load);
  load();
})();
