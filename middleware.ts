import { type NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "auth_session";

/**
 * Verify the session cookie value by recomputing the HMAC of "auth"
 * using APP_PASSWORD as the key. Works in the Edge runtime (Web Crypto).
 */
async function isValidSession(token: string): Promise<boolean> {
  const password = process.env.APP_PASSWORD;
  if (!password || !token) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("auth"));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return token === expected;
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const valid = await isValidSession(token);

  if (!valid) {
    const loginUrl = new URL("/login", req.url);
    // Preserve the original destination so we can redirect after login
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect every route EXCEPT:
     *   /login            — the login page
     *   /api/login        — the login API
     *   /_next/*          — Next.js internals (static, image, etc.)
     *   /icon             — generated favicon
     *   /favicon.ico      — legacy favicon
     */
    "/((?!login|api/login|_next|icon|favicon\\.ico).*)",
  ],
};
