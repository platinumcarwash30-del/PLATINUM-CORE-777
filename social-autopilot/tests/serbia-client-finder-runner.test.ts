import { describe, expect, it, vi } from "vitest";
import { createNotificationService } from "../src/notifications";
import { runSerbiaClientFinderOnce } from "../src/serbia-client-finder-runner";
import type { ScoredSerbiaLead } from "../src/serbia-client-finder";

const nodemailerMock = vi.hoisted(() => {
  const sendMail = vi.fn().mockResolvedValue({});
  return {
    sendMail,
    createTransport: vi.fn(() => ({ sendMail })),
  };
});

vi.mock("nodemailer", () => ({ default: nodemailerMock }));

const baseEnv = {
  NODE_ENV: "test",
  NOTIFICATION_TO: "platinum303030@gmail.com",
  BRAVE_SEARCH_API_KEY: "brave-key",
  SERBIA_CLIENT_FINDER_STATE_PATH: ":memory:",
};

const responseWith = (results: Array<{ title: string; url: string; description?: string }>) =>
  new Response(JSON.stringify({ web: { results } }), { status: 200 });

describe("Serbia client finder runner", () => {
  it("skips cleanly when the Brave key is missing", async () => {
    const result = await runSerbiaClientFinderOnce({
      NOTIFICATION_TO: "platinum303030@gmail.com",
      SERBIA_CLIENT_FINDER_STATE_PATH: ":memory:",
    });

    expect(result).toEqual({ status: "skipped", leads: [] });
  });

  it("returns quiet when the public searches contain no results", async () => {
    const result = await runSerbiaClientFinderOnce(baseEnv, {
      fetchImpl: async () => responseWith([]),
      readState: async () => ({}),
    });

    expect(result).toEqual({ status: "quiet", leads: [] });
  });

  it("notifies and records fresh leads only after notification succeeds", async () => {
    const notified: ScoredSerbiaLead[][] = [];
    const stateWrites: Array<Record<string, string>> = [];
    const result = await runSerbiaClientFinderOnce({
      ...baseEnv,
      SMTP_HOST: "smtp.gmail.com",
    }, {
      now: new Date("2026-09-21T12:00:00.000Z"),
      fetchImpl: async () => responseWith([{
        title: "Salon Example Belgrade",
        url: "https://example.rs",
        description: "Book online",
      }]),
      readState: async () => ({}),
      notify: async (leads) => { notified.push([...leads]); },
      writeState: async (_path, state) => { stateWrites.push(state); },
    });

    expect(result.status).toBe("sent");
    expect(result.leads).toHaveLength(1);
    expect(notified).toHaveLength(1);
    expect(stateWrites).toHaveLength(1);
    expect(stateWrites[0]["https://example.rs/"]).toBe("2026-09-21T12:00:00.000Z");
  });

  it("logs fresh leads without marking state when SMTP is missing", async () => {
    let notifyCalls = 0;
    let writeCalls = 0;
    const result = await runSerbiaClientFinderOnce(baseEnv, {
      fetchImpl: async () => responseWith([{
        title: "Salon Example Belgrade",
        url: "https://example.rs",
        description: "Book online",
      }]),
      readState: async () => ({}),
      notify: async () => { notifyCalls += 1; },
      writeState: async () => { writeCalls += 1; },
    });

    expect(result.status).toBe("logged");
    expect(result.leads).toHaveLength(1);
    expect(notifyCalls).toBe(0);
    expect(writeCalls).toBe(0);
  });

  it("suppresses a lead for seven days but allows an expired record", async () => {
    const fetchImpl = async () => responseWith([{
      title: "Salon Example Belgrade",
      url: "https://example.rs",
      description: "Book online",
    }]);
    const now = new Date("2026-09-21T12:00:00.000Z");
    const withinWindow = await runSerbiaClientFinderOnce({
      ...baseEnv,
      SMTP_HOST: "smtp.gmail.com",
    }, {
      now,
      fetchImpl,
      readState: async () => ({ "https://example.rs/": "2026-09-15T12:00:00.000Z" }),
      notify: async () => undefined,
      writeState: async () => undefined,
    });
    const expired = await runSerbiaClientFinderOnce({
      ...baseEnv,
      SMTP_HOST: "smtp.gmail.com",
    }, {
      now,
      fetchImpl,
      readState: async () => ({ "https://example.rs/": "2026-09-13T12:00:00.000Z" }),
      notify: async () => undefined,
      writeState: async () => undefined,
    });

    expect(withinWindow).toEqual({ status: "quiet", leads: [] });
    expect(expired.status).toBe("sent");
    expect(expired.leads).toHaveLength(1);
  });

  it("sends the digest to the configured recipient with a manual-contact warning", async () => {
    nodemailerMock.sendMail.mockClear();
    const lead: ScoredSerbiaLead = {
      title: "Salon Example Belgrade",
      link: "https://example.rs",
      snippet: "Book online",
      query: "q",
      category: "beauty-wellness",
      geography: "Belgrade",
      score: 88,
      reasons: ["Business category match (+20)"],
      suggestedAngle: "Show Core Review to the business.",
      draftLanguage: "en",
    };

    await createNotificationService({
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "platinumcarwash30@gmail.com",
      smtpPassword: "secret",
      smtpFrom: "PLATINUM CORE 777 <platinumcarwash30@gmail.com>",
      notificationTo: "platinum303030@gmail.com",
    }).sendSerbiaClientFinderDigest([lead], new Date("2026-09-21T12:00:00.000Z"));

    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: "platinum303030@gmail.com",
      from: "PLATINUM CORE 777 <platinumcarwash30@gmail.com>",
      subject: expect.stringContaining("[PLATINUM CORE 777] Serbia client finder"),
      text: expect.stringContaining("Score: 88/100"),
    }));
    expect(nodemailerMock.sendMail.mock.calls[0]?.[0].text).toContain("Manual contact only");
  });
});
