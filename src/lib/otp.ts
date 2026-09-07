import crypto from "node:crypto";

const CODE_TTL_MINUTES = 10;
const SIGNUP_GRANT_CREDITS = 8;

export function generateCode(): string {
  // 6-digit, zero-padded.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(code: string, email: string): string {
  return crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export function codeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60_000);
}

export { SIGNUP_GRANT_CREDITS };
