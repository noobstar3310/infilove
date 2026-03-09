import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session_token")?.value;

  // Public routes that don't need auth
  const publicRoutes = ["/login", "/api/auth/request-otp", "/api/auth/verify-otp"];
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // API routes check auth via the auth helper — let them through
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Protected pages — redirect to login if no session
  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
