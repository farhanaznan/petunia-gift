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
  shipDate,
}: {
  nature: ProductNature;
  config: SubProductConfig;
  productSlug: string;
  subSlug: string;
  unitPriceSen: number;
  shipDate: string;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [legoVariant, setLegoVariant] = useState<
    "male" | "hijab_female" | "non_hijab_female"
  >("male");
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
    <form action={action} className="customizer-shell">
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="subSlug" value={subSlug} />
      <input type="hidden" name="shipDate" value={shipDate} />
      <input type="hidden" name="customization" value={customizationJson} />
      <p className="muted" style={{ textAlign: "center", margin: 0 }}>
        Shipping {shipDate}
      </p>

      <div className="panel stack">
        {nature === "museum_of_us" ? (
          <>
            <p className="nature-tag">Museum of Us</p>
            <label className="stack">
              <span className="field-label">
                Title ({title.length}/{museum.titleMaxChars})
              </span>
              <input
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value.slice(0, museum.titleMaxChars))
                }
                maxLength={museum.titleMaxChars}
                required={museum.requireTitle}
                placeholder="For us"
              />
            </label>
            <label className="stack">
              <span className="field-label">
                Heartfelt message ({messageWords}/{museum.messageMaxWords} words)
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required={museum.requireMessage}
                placeholder="Write something they’ll keep"
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
          <>
            <p className="nature-tag">F1 pick and go</p>
            <p className="lead" style={{ marginBottom: 0 }}>
              No custom text or photos — this option ships as selected.
            </p>
          </>
        ) : null}

        {nature === "graduation_lego_frame" ? (
          <>
            <p className="nature-tag">Graduation Lego Frame</p>
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="field-label" style={{ marginBottom: "0.65rem" }}>
                Choose exactly one Lego variant
              </legend>
              <div className="variant-grid">
                {(graduation.variants ?? []).map((v) => (
                  <label
                    key={v.key}
                    className="variant-card"
                    data-selected={legoVariant === v.key}
                  >
                    <input
                      type="radio"
                      name="legoVariantUi"
                      checked={legoVariant === v.key}
                      onChange={() => setLegoVariant(v.key)}
                    />
                    {v.imageKey ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/media?key=${encodeURIComponent(v.imageKey)}`}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          const fallback = (e.target as HTMLImageElement)
                            .nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = "grid";
                        }}
                      />
                    ) : null}
                    <div
                      className="variant-fallback"
                      style={{ display: v.imageKey ? "none" : "grid" }}
                    >
                      {v.label.slice(0, 1)}
                    </div>
                    <span>{v.label}</span>
                  </label>
                ))}
              </div>
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
      </div>

      <div className="price-board">
        <div className="row">
          <span>Base</span>
          <span>{senToRm(unitPriceSen)}</span>
        </div>
        {surchargeSen ? (
          <div className="row">
            <span>Optional image</span>
            <span>{senToRm(surchargeSen)}</span>
          </div>
        ) : null}
        <div className="row total">
          <span>Subtotal</span>
          <span>{senToRm(unitPriceSen + surchargeSen)}</span>
        </div>
        <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>
          Shipping calculated at checkout
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
