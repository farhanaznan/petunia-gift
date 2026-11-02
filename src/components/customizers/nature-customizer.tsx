"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import {
  startCheckoutAction,
  type ActionState,
} from "@/lib/checkout/actions";
import { senToRm } from "@/lib/money";
import type {
  GraduationLegoFrameConfig,
  MuseumOfUsConfig,
  ProductNature,
  SubProductConfig,
} from "@/lib/natures/types";

const initial: ActionState = {};

export function NatureCustomizer({
  nature,
  config,
  productSlug,
  subSlug,
  unitPriceSen,
}: {
  nature: ProductNature;
  config: SubProductConfig;
  productSlug: string;
  subSlug: string;
  unitPriceSen: number;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageKeysText, setImageKeysText] = useState("");
  const [legoVariant, setLegoVariant] = useState("male");
  const [gradImageKey, setGradImageKey] = useState("");
  const [state, action, pending] = useActionState(startCheckoutAction, initial);

  const museum = config as MuseumOfUsConfig;
  const graduation = config as GraduationLegoFrameConfig;

  const customizationJson = useMemo(() => {
    if (nature === "museum_of_us") {
      const imageKeys = imageKeysText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return JSON.stringify({ title, message, imageKeys });
    }
    if (nature === "graduation_lego_frame") {
      return JSON.stringify({
        legoVariant,
        imageKeys: gradImageKey.trim() ? [gradImageKey.trim()] : [],
      });
    }
    return "{}";
  }, [nature, title, message, imageKeysText, legoVariant, gradImageKey]);

  const surchargePreview =
    nature === "graduation_lego_frame" && gradImageKey.trim()
      ? graduation.optionalImageSurchargeSen ?? 500
      : 0;

  return (
    <form action={action} className="panel stack">
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="subSlug" value={subSlug} />
      <input type="hidden" name="customization" value={customizationJson} />

      {nature === "museum_of_us" ? (
        <>
          <label className="stack">
            <span>Title (max {museum.titleMaxChars} chars)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={museum.titleMaxChars}
              required={museum.requireTitle}
            />
          </label>
          <label className="stack">
            <span>Message (max {museum.messageMaxWords} words)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required={museum.requireMessage}
            />
          </label>
          <label className="stack">
            <span>
              Image keys ({museum.minImages}+) — comma-separated R2 keys or
              placeholders until upload is live
            </span>
            <input
              value={imageKeysText}
              onChange={(e) => setImageKeysText(e.target.value)}
              placeholder="customer/temp/1.jpg, customer/temp/2.jpg"
            />
          </label>
        </>
      ) : null}

      {nature === "f1_pick_and_go" ? (
        <p className="muted">Pick &amp; go — no custom fields. Ready to order.</p>
      ) : null}

      {nature === "graduation_lego_frame" ? (
        <>
          <fieldset className="stack">
            <legend>Lego variant</legend>
            {(graduation.variants ?? []).map((v) => (
              <label key={v.key} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="radio"
                  name="legoVariantUi"
                  checked={legoVariant === v.key}
                  onChange={() => setLegoVariant(v.key)}
                />
                {v.label}
              </label>
            ))}
          </fieldset>
          <label className="stack">
            <span>
              Optional photo key (+{senToRm(graduation.optionalImageSurchargeSen ?? 500)})
            </span>
            <input
              value={gradImageKey}
              onChange={(e) => setGradImageKey(e.target.value)}
              placeholder="customer/temp/grad.jpg"
            />
          </label>
        </>
      ) : null}

      <p>
        Price: <strong>{senToRm(unitPriceSen + surchargePreview)}</strong>
        {surchargePreview ? (
          <span className="muted"> (incl. image surcharge)</span>
        ) : null}
      </p>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="button" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Continue to order"}
      </button>
    </form>
  );
}
