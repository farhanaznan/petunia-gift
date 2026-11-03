import { z } from "zod";

/** 16 Malaysia states / federal territories — no international shipping in MVP. */
export const MALAYSIA_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Putrajaya",
  "Labuan",
] as const;

export type MalaysiaState = (typeof MALAYSIA_STATES)[number];

export const EAST_MALAYSIA_STATES: readonly MalaysiaState[] = [
  "Sabah",
  "Sarawak",
  "Labuan",
];

/** Live shipping fee rule elevated into settings-ready constants (sen). */
export const SHIPPING_FEE_SEN = {
  peninsular: 600,
  east: 1500,
} as const;

export const malaysiaAddressSchema = z.object({
  buyerName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  recipientPhone: z.string().min(8).max(20),
  customerPhone: z.string().min(8).max(20),
  addressLine1: z.string().min(3).max(200),
  addressLine2: z.string().max(200).optional(),
  postcode: z.string().regex(/^\d{5}$/),
  city: z.string().min(2).max(100),
  state: z.enum(MALAYSIA_STATES),
  country: z.literal("MY"),
});

export type MalaysiaAddress = z.infer<typeof malaysiaAddressSchema>;

export function shippingFeeSenForState(state: MalaysiaState): number {
  return EAST_MALAYSIA_STATES.includes(state)
    ? SHIPPING_FEE_SEN.east
    : SHIPPING_FEE_SEN.peninsular;
}

/** Normalize MY mobiles: 01… / +601… → digits for storage/compare. */
export function normalizeMyPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("60") && digits.length >= 10) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}
