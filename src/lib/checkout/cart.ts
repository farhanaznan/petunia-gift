import { cookies } from "next/headers";
import { z } from "zod";
import {
  f1CustomizationSchema,
  graduationCustomizationSchema,
  museumCustomizationSchema,
  productNatureSchema,
  type OrderCustomization,
  type ProductNature,
} from "@/lib/natures/types";

const CART_COOKIE = "petunia_checkout";

export const checkoutCartSchema = z.object({
  productId: z.string().uuid(),
  subProductId: z.string().uuid(),
  productSlug: z.string().min(1),
  subSlug: z.string().min(1),
  productName: z.string().min(1),
  subName: z.string().min(1),
  nature: productNatureSchema,
  unitPriceSen: z.number().int().nonnegative(),
  surchargeSen: z.number().int().nonnegative().default(0),
  shipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customization: z.union([
    museumCustomizationSchema,
    f1CustomizationSchema,
    graduationCustomizationSchema,
  ]),
});

export type CheckoutCart = z.infer<typeof checkoutCartSchema>;

export async function getCheckoutCart(): Promise<CheckoutCart | null> {
  const jar = await cookies();
  const raw = jar.get(CART_COOKIE)?.value;
  if (!raw) return null;
  try {
    return checkoutCartSchema.parse(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
}

export async function setCheckoutCart(cart: CheckoutCart): Promise<void> {
  const parsed = checkoutCartSchema.parse(cart);
  const jar = await cookies();
  jar.set(CART_COOKIE, encodeURIComponent(JSON.stringify(parsed)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 2,
  });
}

export async function clearCheckoutCart(): Promise<void> {
  const jar = await cookies();
  jar.delete(CART_COOKIE);
}

export function computeSurchargeSen(
  nature: ProductNature,
  customization: OrderCustomization,
  optionalImageSurchargeSen = 500,
): number {
  if (nature !== "graduation_lego_frame") return 0;
  const grad = customization as z.infer<typeof graduationCustomizationSchema>;
  return (grad.imageKeys?.length ?? 0) > 0 ? optionalImageSurchargeSen : 0;
}
