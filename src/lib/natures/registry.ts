import {
  f1PickAndGoConfigSchema,
  graduationLegoFrameConfigSchema,
  museumOfUsConfigSchema,
  type NatureConfigMap,
  type ProductNature,
  type SubProductConfig,
} from "./types";

type NatureModule<N extends ProductNature> = {
  nature: N;
  label: string;
  description: string;
  /** Parse + validate admin-authored sub-product.config */
  parseConfig: (raw: unknown) => NatureConfigMap[N];
  /** Soft defaults used when seeding a new sub-product shell */
  defaultConfig: () => NatureConfigMap[N];
};

const museum: NatureModule<"museum_of_us"> = {
  nature: "museum_of_us",
  label: "Museum of Us",
  description: "Title, heartfelt message, and N required customer photos.",
  parseConfig: (raw) => museumOfUsConfigSchema.parse(raw),
  defaultConfig: () => ({
    minImages: 1,
    titleMaxChars: 20,
    messageMaxWords: 50,
    requireTitle: true,
    requireMessage: true,
  }),
};

const f1: NatureModule<"f1_pick_and_go"> = {
  nature: "f1_pick_and_go",
  label: "F1 pick & go",
  description: "No customer text or photos — ready-made collectible / frame.",
  parseConfig: (raw) => f1PickAndGoConfigSchema.parse(raw ?? {}),
  defaultConfig: () => ({}),
};

const graduation: NatureModule<"graduation_lego_frame"> = {
  nature: "graduation_lego_frame",
  label: "Graduation Lego Frame",
  description: "Choose one of three Lego variants; optional customer photo (+surcharge).",
  parseConfig: (raw) => graduationLegoFrameConfigSchema.parse(raw),
  defaultConfig: () => ({
    variants: [
      { key: "male", label: "Male", imageKey: "products/graduation/variants/male.png" },
      {
        key: "hijab_female",
        label: "Female (hijab)",
        imageKey: "products/graduation/variants/hijab-female.png",
      },
      {
        key: "non_hijab_female",
        label: "Female (non-hijab)",
        imageKey: "products/graduation/variants/non-hijab-female.png",
      },
    ],
    optionalImageSurchargeSen: 500,
  }),
};

export const natureRegistry = {
  museum_of_us: museum,
  f1_pick_and_go: f1,
  graduation_lego_frame: graduation,
} as const;

export function getNatureModule(nature: ProductNature) {
  return natureRegistry[nature];
}

export function parseSubProductConfig(
  nature: ProductNature,
  raw: unknown,
): SubProductConfig {
  return natureRegistry[nature].parseConfig(raw) as SubProductConfig;
}

export function listNatures(): ProductNature[] {
  return Object.keys(natureRegistry) as ProductNature[];
}
