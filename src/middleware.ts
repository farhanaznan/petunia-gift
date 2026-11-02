import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import {
  type AdminSessionData,
  getSessionOptions,
} from "@/lib/auth/session";

function middlewareSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  // Shell staging / local without secrets: allow middleware to run; login will still need DB.
  return "dev-only-session-secret-min-32-chars!!";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<AdminSessionData>(
    request,
    response,
    getSessionOptions(middlewareSecret()),
  );

  if (!session.isLoggedIn || !session.adminId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
