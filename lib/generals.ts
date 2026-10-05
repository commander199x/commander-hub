// Generals of C&C Generals Zero Hour, with English + Arabic names.
// Arabic names need a native review.

export type Faction = "usa" | "china" | "gla";

export type GeneralKey =
  | "usa" | "usa_air" | "usa_laser" | "usa_super"
  | "china" | "china_inf" | "china_nuke" | "china_tank"
  | "gla" | "gla_demo" | "gla_stealth" | "gla_toxin";

export type General = { key: GeneralKey; faction: Faction; en: string; ar: string; short: string; shortAr: string };

export const FACTIONS: Record<Faction, { en: string; ar: string; color: string; code: string }> = {
  usa: { en: "USA", ar: "أمريكا", color: "#6FA8DC", code: "USA" },
  china: { en: "China", ar: "الصين", color: "#E06666", code: "CHN" },
  gla: { en: "GLA", ar: "جيش التحرير", color: "#D9B44A", code: "GLA" },
};

export const GENERALS: General[] = [
  { key: "usa", faction: "usa", en: "USA (no general)", ar: "أمريكا (بدون جنرال)", short: "USA", shortAr: "أمريكا" },
  { key: "usa_air", faction: "usa", en: "Air Force General", ar: "جنرال القوات الجوية", short: "Air Force", shortAr: "الجوية" },
  { key: "usa_laser", faction: "usa", en: "Laser General", ar: "جنرال الليزر", short: "Laser", shortAr: "الليزر" },
  { key: "usa_super", faction: "usa", en: "Superweapon General", ar: "جنرال الأسلحة الخارقة", short: "Superweapon", shortAr: "الخارقة" },
  { key: "china", faction: "china", en: "China (no general)", ar: "الصين (بدون جنرال)", short: "China", shortAr: "الصين" },
  { key: "china_inf", faction: "china", en: "Infantry General", ar: "جنرال المشاة", short: "Infantry", shortAr: "المشاة" },
  { key: "china_nuke", faction: "china", en: "Nuke General", ar: "جنرال النووي", short: "Nuke", shortAr: "النووي" },
  { key: "china_tank", faction: "china", en: "Tank General", ar: "جنرال الدبابات", short: "Tank", shortAr: "الدبابات" },
  { key: "gla", faction: "gla", en: "GLA (no general)", ar: "جيش التحرير (بدون جنرال)", short: "GLA", shortAr: "جيش التحرير" },
  { key: "gla_demo", faction: "gla", en: "Demolition General", ar: "جنرال التفجير", short: "Demolition", shortAr: "التفجير" },
  { key: "gla_stealth", faction: "gla", en: "Stealth General", ar: "جنرال التخفي", short: "Stealth", shortAr: "التخفي" },
  { key: "gla_toxin", faction: "gla", en: "Toxin General", ar: "جنرال السموم", short: "Toxin", shortAr: "السموم" },
];

export const GENERAL_BY_KEY: Record<GeneralKey, General> = Object.fromEntries(GENERALS.map((g) => [g.key, g])) as Record<GeneralKey, General>;

export function isGeneralKey(x: unknown): x is GeneralKey {
  return typeof x === "string" && x in GENERAL_BY_KEY;
}

/** Safely read a match's `generals` field ({ username: generalKey }). */
export function readGenerals(v: unknown): Record<string, GeneralKey> {
  const out: Record<string, GeneralKey> = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const [name, key] of Object.entries(v as Record<string, unknown>)) if (isGeneralKey(key)) out[name] = key;
  }
  return out;
}

export const generalName = (key: GeneralKey, lang: "en" | "ar") => GENERAL_BY_KEY[key][lang];
export const generalShort = (key: GeneralKey, lang: "en" | "ar") => (lang === "ar" ? GENERAL_BY_KEY[key].shortAr : GENERAL_BY_KEY[key].short);
