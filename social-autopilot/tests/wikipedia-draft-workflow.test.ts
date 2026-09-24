import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = join(process.cwd(), "..", ".github", "workflows", "wikipedia-draft-monitor.yml");

describe("Wikipedia draft workflow", () => {
  it("keeps the monitor read-only and publishes only an expiring review artifact", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("name: PLATINUM CORE 777 Wikipedia Draft Monitor");
    expect(workflow).toContain('cron: "0 8 * * *"');
    expect(workflow).toContain("permissions:");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("npm run wikipedia-draft:once");
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("retention-days: 14");
    expect(workflow).toContain("PLATINUM-CORE-777-draft.md");
    expect(workflow).toContain("PLATINUM-CORE-777-sources.md");

    expect(workflow).not.toContain("contents: write");
    expect(workflow).not.toContain("wikipedia.org/api");
    expect(workflow).not.toContain("action=publish");
    expect(workflow).not.toContain("git commit");
    expect(workflow).not.toContain("git push");
  });
});
