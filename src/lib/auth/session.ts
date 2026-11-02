import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type AdminSessionData = {
  adminId?: string;
  email?: string;
  isLoggedIn: boolean;
};

export const ADMIN_SESSION_COOKIE = "petunia_admin_session";

const DEV_FALLBACK_SECRET = "dev-only-session-secret-min-32-chars!!";

export function getSessionOptions(password: string): SessionOptions {
  if (password.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }

  return {
    password,
    cookieName: ADMIN_SESSION_COOKIE,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

/** Server-side admin session stub — wire login action in Phase 1. */
export async function getAdminSession(
  secret = process.env.SESSION_SECRET ?? DEV_FALLBACK_SECRET,
): Promise<IronSession<AdminSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(
    cookieStore,
    getSessionOptions(secret),
  );
}

export async function requireAdminSession(): Promise<IronSession<AdminSessionData> | null> {
  const session = await getAdminSession();
  if (!session.isLoggedIn || !session.adminId) {
    return null;
  }
  return session;
}
