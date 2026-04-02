const COUNTRY_METHODS: Record<string, { method: string; label: string }> = {
  // Built-in adhan methods
  SA: { method: "UmmAlQura", label: "Umm Al-Qura" },
  AE: { method: "Dubai", label: "Dubai" },
  EG: { method: "Egyptian", label: "Egyptian" },
  TR: { method: "Turkey", label: "Turkey" },
  PK: { method: "Karachi", label: "Karachi" },
  QA: { method: "Qatar", label: "Qatar" },
  KW: { method: "Kuwait", label: "Kuwait" },
  US: { method: "NorthAmerica", label: "ISNA" },
  CA: { method: "NorthAmerica", label: "ISNA" },
  IR: { method: "Tehran", label: "Tehran" },
  // Custom methods
  JO: { method: "Jordan", label: "Jordan" },
  DZ: { method: "Algeria", label: "Algeria" },
  TN: { method: "Tunisia", label: "Tunisia" },
  FR: { method: "France", label: "UOIF" },
  RU: { method: "Russia", label: "Russia" },
  MA: { method: "Morocco", label: "Morocco" },
  PT: { method: "Portugal", label: "Lisbon" },
  // Gulf region (Bahrain, Oman, Yemen) — follows Umm Al-Qura
  BH: { method: "UmmAlQura", label: "Umm Al-Qura" },
  OM: { method: "UmmAlQura", label: "Umm Al-Qura" },
  YE: { method: "UmmAlQura", label: "Umm Al-Qura" },
};

const DEFAULT_METHOD = {
  method: "MuslimWorldLeague",
  label: "Muslim World League",
};

export function getCalculationMethod(countryIso: string | null): {
  method: string;
  label: string;
} {
  if (!countryIso) return DEFAULT_METHOD;
  return COUNTRY_METHODS[countryIso] ?? DEFAULT_METHOD;
}
