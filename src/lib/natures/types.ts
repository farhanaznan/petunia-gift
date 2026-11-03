import { z } from "zod";

/** Locked MVP product natures — register new types here, never branch on product name strings. */
export const PRODUCT_NATURES = [
  "museum_of_us",
  "f1_pick_and_go",
  "graduation_lego_frame",
] as const;

export type ProductNature = (typeof PRODUCT_NATURES)[number];

export const productNatureSchema = z.enum(PRODUCT_NATURES);

export const museumOfUsConfigSchema = z.object({
  minImages: z.number().int().min(1).max(12),
  titleMaxChars: z.number().int().positive().default(20),
  messageMaxWords: z.number().int().positive().default(50),
  requireTitle: z.boolean().default(true),
  requireMessage: z.boolean().default(true),
});

export type MuseumOfUsConfig = z.infer<typeof museumOfUsConfigSchema>;

export const f1PickAndGoConfigSchema = z.object({
  includedCopy: z.string().max(500).optional(),
});

export type F1PickAndGoConfig = z.infer<typeof f1PickAndGoConfigSchema>;

export const legoVariantKeySchema = z.enum([
  "male",
  "hijab_female",
  "non_hijab_female",
]);

export type LegoVariantKey = z.infer<typeof legoVariantKeySchema>;

export const graduationLegoFrameConfigSchema = z.object({
  variants: z
    .array(
      z.object({
        key: legoVariantKeySchema,
        label: z.string().min(1),
        imageKey: z.string().min(1),
      }),
    )
    .length(3),
  /** Default RM5.00 = 500 sen */
  optionalImageSurchargeSen: z.number().int().nonnegative().default(500),
});

export type GraduationLegoFrameConfig = z.infer<
  typeof graduationLegoFrameConfigSchema
>;

export type NatureConfigMap = {
  museum_of_us: MuseumOfUsConfig;
  f1_pick_and_go: F1PickAndGoConfig;
  graduation_lego_frame: GraduationLegoFrameConfig;
};

export type SubProductConfig = NatureConfigMap[ProductNature];

/** Customer customization payloads stored on orders.customization JSONB */
export const museumCustomizationSchema = z.object({
  title: z.string(),
  message: z.string(),
  imageKeys: z.array(z.string()),
});

export const f1CustomizationSchema = z.object({}).strict();

export const graduationCustomizationSchema = z.object({
  legoVariant: legoVariantKeySchema,
  imageKeys: z.array(z.string()).max(1),
});

export type OrderCustomization =
  | z.infer<typeof museumCustomizationSchema>
  | z.infer<typeof f1CustomizationSchema>
  | z.infer<typeof graduationCustomizationSchema>;
