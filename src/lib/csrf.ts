import { NextRequest } from "next/server";

export function validateOrigin(request: NextRequest): boolean {
  // GET, HEAD, OPTIONS guvenli metodlar — CSRF kontrolu atla
  const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (safeMethod) return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Origin ve referer yoksa izin ver (ayni-origin istekleri, sunucu tarafi cagrilari)
  if (!origin && !referer) return true;

  const allowedOrigins = [
    process.env.NEXTAUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ].map((url) => new URL(url).origin);

  if (origin && allowedOrigins.includes(origin)) return true;

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.includes(refererOrigin)) return true;
    } catch {
      return false;
    }
  }

  return false;
}
