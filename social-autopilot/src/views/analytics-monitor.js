(() => {
  const byId = (id) => document.getElementById(id);
  const navItems = [...document.querySelectorAll("[data-view]")];
  const views = [...document.querySelectorAll("[data-panel-view]")];
  const viewTitles = {
    overview: "Pregled",
    "search-console": "Search Console",
    analytics: "Google Analytics",
    queries: "Upiti",
    pages: "Stranice",
    schedule: "Raspored",
  };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const number = (value) => Number(value ?? 0).toLocaleString("en-US");

  function activateView(view) {
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
    views.forEach((section) => section.classList.toggle("active", section.dataset.panelView === view));
    byId("view-title").textContent = viewTitles[view] || "Pregled";
  }

  function sourceStatus(source, targets) {
    targets.forEach((target) => {
      const badge = byId(target);
      if (!badge) return;
      badge.textContent = source.status === "ok" ? "OK" : "Error";
      badge.className = `badge ${source.status}`;
    });
  }

  function metricCards(items, target) {
    byId(target).innerHTML = items
      .map(([label, value]) => `<article class="card"><div class="card-label">${escapeHtml(label)}</div><div class="card-value">${escapeHtml(value)}</div></article>`)
      .join("");
  }

  function searchTable(rows) {
    if (!rows.length) return "No watched queries had data in this period.";
    return `<table><thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.query)}</td><td>${number(row.clicks)}</td><td>${number(row.impressions)}</td><td>${(Number(row.ctr) * 100).toFixed(2)}%</td><td>${Number(row.position).toFixed(2)}</td></tr>`).join("")}</tbody></table>`;
  }

  function pagesTable(pages) {
    if (!pages.length) return "No page rows had data in this period.";
    return `<table><thead><tr><th>Page</th><th>Users</th><th>Sessions</th><th>Views</th></tr></thead><tbody>${pages.map((page) => `<tr><td>${escapeHtml(page.pagePath)}</td><td>${number(page.activeUsers)}</td><td>${number(page.sessions)}</td><td>${number(page.screenPageViews)}</td></tr>`).join("")}</tbody></table>`;
  }

  function sourceError(source, fallback) {
    return source.status === "error" ? `<p class="error">${escapeHtml(source.error || fallback)}</p>` : null;
  }

  function render(report) {
    byId("status").textContent = "Live data loaded";
    byId("period").textContent = `Period: ${report.startDate} to ${report.endDate}`;
    byId("checked").textContent = `Checked: ${new Date(report.checkedAt).toLocaleString()}`;

    sourceStatus(report.searchConsole, ["search-status", "search-status-detail"]);
    sourceStatus(report.analytics, ["analytics-status", "analytics-status-detail"]);

    const search = report.searchConsole.data;
    const analytics = report.analytics.data;
    const searchRows = search?.rows || [];
    const pages = analytics?.topPages || [];
    const searchClicks = searchRows.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
    const searchImpressions = searchRows.reduce((sum, row) => sum + Number(row.impressions || 0), 0);

    metricCards([
      ["Active users", analytics ? number(analytics.summary.activeUsers) : "—"],
      ["Sessions", analytics ? number(analytics.summary.sessions) : "—"],
      ["Page views", analytics ? number(analytics.summary.screenPageViews) : "—"],
      ["Watched clicks", number(searchClicks)],
      ["Watched impressions", number(searchImpressions)],
      ["Queries with data", number(searchRows.length)],
    ], "summary-cards");

    metricCards([
      ["Active users", analytics ? number(analytics.summary.activeUsers) : "—"],
      ["Sessions", analytics ? number(analytics.summary.sessions) : "—"],
      ["Screen/page views", analytics ? number(analytics.summary.screenPageViews) : "—"],
    ], "analytics-summary-cards");

    const searchError = sourceError(report.searchConsole, "Search Console error");
    const analyticsError = sourceError(report.analytics, "Analytics error");
    byId("search-content").innerHTML = searchError || searchTable(searchRows);
    byId("queries-content").innerHTML = searchError || searchTable(searchRows);
    byId("analytics-content").innerHTML = analyticsError || pagesTable(pages);
    byId("pages-content").innerHTML = analyticsError || pagesTable(pages);

    byId("search-overview").innerHTML = searchError || `${number(searchClicks)} clicks · ${number(searchImpressions)} impressions · ${number(searchRows.length)} watched queries with data.`;
    byId("analytics-overview").innerHTML = analyticsError || `${number(analytics.summary.activeUsers)} active users · ${number(analytics.summary.sessions)} sessions · ${number(analytics.summary.screenPageViews)} page views.`;
  }

  async function load() {
    byId("status").textContent = "Loading live data...";
    byId("refresh").disabled = true;
    try {
      const response = await fetch("/api/analytics-monitor", { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`Request failed: HTTP ${response.status}`);
      render(await response.json());
    } catch (error) {
      byId("status").textContent = error instanceof Error ? error.message : "Panel request failed";
    } finally {
      byId("refresh").disabled = false;
    }
  }

  navItems.forEach((item) => item.addEventListener("click", () => activateView(item.dataset.view)));
  byId("refresh").addEventListener("click", load);
  load();
})();
