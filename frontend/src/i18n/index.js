import en from "@/i18n/en.json";

const dictionaries = { en };

export function t(key, fallback = "") {
  const locale = "en";
  const dict = dictionaries[locale] || dictionaries.en;
  return dict?.[key] || fallback || key;
}
