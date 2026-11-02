"use client";

import { useActionState, useMemo, useState } from "react";
import {
  placeOrderAction,
  type ActionState,
} from "@/lib/checkout/actions";
import { EAST_MALAYSIA_STATES, SHIPPING_FEE_SEN } from "@/lib/malaysia";
import { senToRm } from "@/lib/money";

const initial: ActionState = {};

export function PlaceOrderForm({
  shipDates,
  states,
  unitPriceSen,
  surchargeSen,
}: {
  shipDates: { shipDate: string; remaining: number }[];
  states: string[];
  unitPriceSen: number;
  surchargeSen: number;
}) {
  const [state, action, pending] = useActionState(placeOrderAction, initial);
  const [selectedState, setSelectedState] = useState("");
  const [shipDate, setShipDate] = useState(shipDates[0]?.shipDate ?? "");

  const shippingFeeSen = useMemo(() => {
    if (!selectedState) return null;
    return EAST_MALAYSIA_STATES.includes(
      selectedState as (typeof EAST_MALAYSIA_STATES)[number],
    )
      ? SHIPPING_FEE_SEN.east
      : SHIPPING_FEE_SEN.peninsular;
  }, [selectedState]);

  const total =
    shippingFeeSen == null
      ? null
      : unitPriceSen + surchargeSen + shippingFeeSen;

  return (
    <form action={action} className="checkout-layout">
      <div className="panel elevated stack">
        <div className="stack">
          <span className="field-label">Ship date (open capacity only)</span>
          <input type="hidden" name="shipDate" value={shipDate} required />
          <div className="chip-row" role="listbox" aria-label="Ship dates">
            {shipDates.map((d) => (
              <button
                key={d.shipDate}
                type="button"
                className="chip"
                role="option"
                aria-selected={shipDate === d.shipDate}
                data-selected={shipDate === d.shipDate}
                onClick={() => setShipDate(d.shipDate)}
              >
                {d.shipDate}
                <span className="chip-meta">{d.remaining} left</span>
              </button>
            ))}
          </div>
          {!shipDates.length ? (
            <p className="form-error">
              No open capacity dates. Ask admin to add slots.
            </p>
          ) : null}
        </div>

        <div className="form-grid">
          <label className="stack span-2">
            <span className="field-label">Buyer full name</span>
            <input name="buyerName" required autoComplete="name" />
          </label>
          <label className="stack span-2">
            <span className="field-label">Email</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="stack">
            <span className="field-label">Customer (gifter) phone</span>
            <input name="customerPhone" required placeholder="01…" inputMode="tel" />
          </label>
          <label className="stack">
            <span className="field-label">Recipient phone</span>
            <input name="recipientPhone" required placeholder="01…" inputMode="tel" />
          </label>
          <label className="stack span-2">
            <span className="field-label">Address line 1</span>
            <input name="addressLine1" required autoComplete="address-line1" />
          </label>
          <label className="stack span-2">
            <span className="field-label">Address line 2</span>
            <input name="addressLine2" autoComplete="address-line2" />
          </label>
          <label className="stack">
            <span className="field-label">Postcode</span>
            <input
              name="postcode"
              required
              pattern="\d{5}"
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </label>
          <label className="stack">
            <span className="field-label">City</span>
            <input name="city" required autoComplete="address-level2" />
          </label>
          <label className="stack span-2">
            <span className="field-label">State (Malaysia only)</span>
            <select
              name="state"
              required
              defaultValue=""
              onChange={(e) => setSelectedState(e.target.value)}
            >
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
        </div>
        <input type="hidden" name="country" value="MY" />

        {state.error ? (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        ) : null}

        <button
          className="button"
          type="submit"
          disabled={pending || !shipDates.length || !shipDate}
        >
          {pending ? "Reserving capacity…" : "Continue to Touch ’n Go payment"}
        </button>
      </div>

      <aside className="checkout-summary">
        <div className="price-board">
          <div className="row">
            <span>Item</span>
            <span>{senToRm(unitPriceSen)}</span>
          </div>
          <div className="row">
            <span>Surcharge</span>
            <span>{senToRm(surchargeSen)}</span>
          </div>
          <div className="row">
            <span>Shipping</span>
            <span>{shippingFeeSen == null ? "—" : senToRm(shippingFeeSen)}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <span>{total == null ? "Select state" : senToRm(total)}</span>
          </div>
          <p
            className="muted"
            style={{ margin: "0.45rem 0 0", color: "#a9cbbd", fontSize: "0.78rem" }}
          >
            Peninsular {senToRm(SHIPPING_FEE_SEN.peninsular)} · East MY{" "}
            {senToRm(SHIPPING_FEE_SEN.east)}
          </p>
        </div>
      </aside>
    </form>
  );
}
