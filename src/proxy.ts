import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";

// Next.js 16 uses proxy.ts instead of middleware.ts
// Auth middleware wraps CSRF check
export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;

  // CSRF check for mutation requests to API (except auth routes)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    if (!validateOrigin(request as unknown as NextRequest)) {
      return NextResponse.json(
        { success: false, error: "CSRF doğrulaması başarısız" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|manifest\\.json).*)",
  ],
};
