"use client";

import { useActionState } from "react";
import type { AdminActionState } from "@/lib/admin/catalog-actions";

const initial: AdminActionState = {};

export function AdminActionForm({
  action,
  children,
  submitLabel = "Save",
}: {
  action: (
    prev: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="panel stack">
      {children}
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? <p className="form-info">{state.info}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
