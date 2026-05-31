import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

// ── In-memory rate limiter ────────────────────────────────────────────────────
// Note: resets on cold starts in serverless environments.
// Sufficient for a low-traffic personal app.
const attempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// ── Token — HMAC of "auth" keyed on APP_PASSWORD ──────────────────────────────
function computeToken(password: string): string {
  return createHmac("sha256", password).update("auth").digest("hex");
}

export async function POST(req: NextRequest) {
  // Fail secure: if no password is configured, deny all logins
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json(
      { error: "Server misconfiguration — APP_PASSWORD is not set." },
      { status: 503 }
    );
  }

  // Rate limiting by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  // Validate submitted password
  const body = await req.json().catch(() => ({}));
  const submitted: string = body.password ?? "";

  if (!submitted || submitted !== appPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Success — set a signed, httpOnly session cookie
  const token = computeToken(appPassword);
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return res;
}
