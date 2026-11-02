"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { UploadField } from "@/components/upload-field";
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
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [legoVariant, setLegoVariant] = useState<"male" | "hijab_female" | "non_hijab_female">("male");
  const [gradImageKeys, setGradImageKeys] = useState<string[]>([]);
  const [state, action, pending] = useActionState(startCheckoutAction, initial);

  const museum = config as MuseumOfUsConfig;
  const graduation = config as GraduationLegoFrameConfig;
  const surchargeSen =
    nature === "graduation_lego_frame" && gradImageKeys.length > 0
      ? graduation.optionalImageSurchargeSen ?? 500
      : 0;

  const messageWords = message.trim() ? message.trim().split(/\s+/).length : 0;

  const customizationJson = useMemo(() => {
    if (nature === "museum_of_us") {
      return JSON.stringify({ title, message, imageKeys });
    }
    if (nature === "graduation_lego_frame") {
      return JSON.stringify({
        legoVariant,
        imageKeys: gradImageKeys.slice(0, 1),
      });
    }
    return "{}";
  }, [nature, title, message, imageKeys, legoVariant, gradImageKeys]);

  return (
    <form action={action} className="panel stack">
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="subSlug" value={subSlug} />
      <input type="hidden" name="customization" value={customizationJson} />

      {nature === "museum_of_us" ? (
        <>
          <label className="stack">
            <span>
              Title ({title.length}/{museum.titleMaxChars})
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, museum.titleMaxChars))}
              maxLength={museum.titleMaxChars}
              required={museum.requireTitle}
            />
          </label>
          <label className="stack">
            <span>
              Heartfelt message ({messageWords}/{museum.messageMaxWords} words)
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required={museum.requireMessage}
            />
          </label>
          <UploadField
            kind="customer_image"
            label={`Custom photos (min ${museum.minImages})`}
            accept="image/jpeg,image/png,image/webp"
            multiple
            maxFiles={Math.max(museum.minImages, 12)}
            onKeysChange={setImageKeys}
          />
        </>
      ) : null}

      {nature === "f1_pick_and_go" ? (
        <p className="muted">Pick &amp; go — no custom text or photos. Ready to order.</p>
      ) : null}

      {nature === "graduation_lego_frame" ? (
        <>
          <fieldset className="stack">
            <legend>Choose exactly one Lego variant</legend>
            {(graduation.variants ?? []).map((v) => (
              <label key={v.key} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="radio"
                  name="legoVariantUi"
                  checked={legoVariant === v.key}
                  onChange={() => setLegoVariant(v.key)}
                />
                <span>{v.label}</span>
                {v.imageKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media?key=${encodeURIComponent(v.imageKey)}`}
                    alt={v.label}
                    width={48}
                    height={48}
                    style={{ objectFit: "cover", borderRadius: 6 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : null}
              </label>
            ))}
          </fieldset>
          <UploadField
            kind="customer_image"
            label={`Optional photo (+${senToRm(graduation.optionalImageSurchargeSen ?? 500)}) — max 1`}
            accept="image/jpeg,image/png,image/webp"
            maxFiles={1}
            onKeysChange={setGradImageKeys}
          />
        </>
      ) : null}

      <div className="panel stack">
        <strong>Price</strong>
        <p>Base {senToRm(unitPriceSen)}</p>
        {surchargeSen ? <p>Optional image {senToRm(surchargeSen)}</p> : null}
        <p>
          Subtotal now <strong>{senToRm(unitPriceSen + surchargeSen)}</strong>
          <span className="muted"> (+ shipping at checkout)</span>
        </p>
      </div>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        className="button"
        type="submit"
        disabled={
          pending ||
          (nature === "museum_of_us" &&
            (imageKeys.length < (museum.minImages ?? 1) ||
              messageWords > (museum.messageMaxWords ?? 50))) ||
          (nature === "graduation_lego_frame" && !legoVariant)
        }
      >
        {pending ? "Saving…" : "Continue to order"}
      </button>
    </form>
  );
}
