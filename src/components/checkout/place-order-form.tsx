"use client";

import { useActionState } from "react";
import {
  placeOrderAction,
  type ActionState,
} from "@/lib/checkout/actions";

const initial: ActionState = {};

export function PlaceOrderForm({
  shipDates,
  states,
}: {
  shipDates: string[];
  states: string[];
}) {
  const [state, action, pending] = useActionState(placeOrderAction, initial);

  return (
    <form action={action} className="panel stack">
      <label className="stack">
        <span>Ship date</span>
        <select name="shipDate" required defaultValue="">
          <option value="" disabled>
            Select an open date
          </option>
          {shipDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      {!shipDates.length ? (
        <p className="form-error">No open capacity dates. Ask admin to add slots.</p>
      ) : null}

      <label className="stack">
        <span>Buyer full name</span>
        <input name="buyerName" required />
      </label>
      <label className="stack">
        <span>Email</span>
        <input name="email" type="email" required />
      </label>
      <label className="stack">
        <span>Customer (gifter) phone</span>
        <input name="customerPhone" required placeholder="01…" />
      </label>
      <label className="stack">
        <span>Recipient phone</span>
        <input name="recipientPhone" required placeholder="01…" />
      </label>
      <label className="stack">
        <span>Address line 1</span>
        <input name="addressLine1" required />
      </label>
      <label className="stack">
        <span>Address line 2</span>
        <input name="addressLine2" />
      </label>
      <label className="stack">
        <span>Postcode</span>
        <input name="postcode" required pattern="\d{5}" />
      </label>
      <label className="stack">
        <span>City</span>
        <input name="city" required />
      </label>
      <label className="stack">
        <span>State</span>
        <select name="state" required defaultValue="">
          <option value="" disabled>
            Select state
          </option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="country" value="MY" />

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="button" type="submit" disabled={pending || !shipDates.length}>
        {pending ? "Placing hold…" : "Continue to Touch ’n Go payment"}
      </button>
    </form>
  );
}
