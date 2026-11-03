/**
 * Merge process.env with Cloudflare Worker bindings/secrets when available.
 * Safe to call from Server Components / Actions / Route Handlers.
 */
export async function getRuntimeEnv(): Promise<
  NodeJS.ProcessEnv & Partial<CloudflareEnv>
> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return {
      ...process.env,
      ...(env as unknown as Record<string, unknown>),
    } as NodeJS.ProcessEnv & Partial<CloudflareEnv>;
  } catch {
    return process.env as NodeJS.ProcessEnv & Partial<CloudflareEnv>;
  }
}

export function resolveSessionSecret(env: unknown = process.env): string {
  const record = env as { SESSION_SECRET?: string };
  const secret = record.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[petunia-gift] SESSION_SECRET missing or <32 chars — using insecure fallback. Set a Worker secret before soft-launch.",
    );
  }

  return "dev-only-session-secret-min-32-chars!!";
}
