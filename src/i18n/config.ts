export const LOCALES = ["ar", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** `<html dir>` for a locale. Arabic is the only RTL locale we ship. */
export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** The locale the switcher offers, with the label it is written in. */
export const SWITCH_TO: Record<Locale, { locale: Locale; label: string }> = {
  ar: { locale: "en", label: "EN" },
  en: { locale: "ar", label: "العربية" },
};
