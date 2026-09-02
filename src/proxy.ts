import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/firebase/session-cookie";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/documents",
  "/recruitments",
  "/users",
];

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(prefix =>
    pathname.startsWith(prefix)
  );
  const isLogin = pathname.startsWith("/login");

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/recruitments";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/documents/:path*",
    "/recruitments/:path*",
    "/users/:path*",
    "/login",
  ],
};
