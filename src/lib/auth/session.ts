import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { getRuntimeEnv, resolveSessionSecret } from "@/lib/runtime-env";

export type AdminSessionData = {
  adminId?: string;
  email?: string;
  isLoggedIn: boolean;
};

export const ADMIN_SESSION_COOKIE = "petunia_admin_session";

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

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  const env = await getRuntimeEnv();
  const secret = resolveSessionSecret(env);
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
