const COUNTRY_METHODS: Record<string, { method: string; label: string }> = {
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
