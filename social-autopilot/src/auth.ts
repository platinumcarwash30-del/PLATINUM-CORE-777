import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

export interface Session {
  id: string;
  csrfToken: string;
  expiresAt: number;
}

export interface AuthManager {
  authenticate(username: string, password: string): boolean;
  createSession(): Session;
  getSession(id: string): Session | undefined;
  destroySession(id: string): void;
  checkCsrf(session: Session, token: string): boolean;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createAuthManager(config: { adminUsername: string; adminPasswordHash?: string; sessionTtlMs?: number }): AuthManager {
  const sessions = new Map<string, Session>();
  const ttl = config.sessionTtlMs ?? 8 * 60 * 60 * 1000;
  return {
    authenticate(username, password) {
      return username === config.adminUsername && Boolean(config.adminPasswordHash) && verifyPassword(password, config.adminPasswordHash!);
    },
    createSession() {
      const session = { id: randomUUID(), csrfToken: randomBytes(24).toString("hex"), expiresAt: Date.now() + ttl };
      sessions.set(session.id, session);
      return session;
    },
    getSession(id) {
      const session = sessions.get(id);
      if (!session || session.expiresAt < Date.now()) {
        if (session) sessions.delete(id);
        return undefined;
      }
      return session;
    },
    destroySession(id) { sessions.delete(id); },
    checkCsrf(session, token) {
      const expected = Buffer.from(session.csrfToken);
      const actual = Buffer.from(token);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    },
  };
}
