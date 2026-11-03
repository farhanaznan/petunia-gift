"use client";

import { useActionState } from "react";
import {
  loginAdminAction,
  seedFirstAdminAction,
  type LoginState,
} from "@/lib/auth/actions";

const initial: LoginState = {};

async function seedAction(
  _prev: LoginState,
  _formData: FormData,
): Promise<LoginState> {
  void _prev;
  void _formData;
  return seedFirstAdminAction();
}

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAdminAction,
    initial,
  );
  const [seedState, seedFormAction, seedPending] = useActionState(
    seedAction,
    initial,
  );

  const message = loginState.error || seedState.error;
  const info = loginState.info || seedState.info;

  return (
    <div className="stack">
      <form action={loginFormAction} className="stack">
        <input type="hidden" name="next" value={nextPath} />
        <label className="stack">
          <span className="field-label">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="admin@petunia.local"
          />
        </label>
        <label className="stack">
          <span className="field-label">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </label>
        {message ? (
          <p className="form-error" role="alert">
            {message}
          </p>
        ) : null}
        {info ? <p className="form-info">{info}</p> : null}
        <button className="button" type="submit" disabled={loginPending}>
          {loginPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <form action={seedFormAction}>
        <button
          className="button secondary"
          type="submit"
          disabled={seedPending}
        >
          {seedPending ? "Seeding…" : "Seed first admin from env"}
        </button>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
          Only works when <code>admins</code> is empty and seed env vars are set.
        </p>
      </form>
    </div>
  );
}
