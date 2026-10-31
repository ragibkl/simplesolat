import { CalculationMethod, CalculationParameters, Rounding } from "adhan";

import bundled from "@/assets/methods.json";

// Calculation methods for places without an official timetable, from
// simplesolat-data's methods.yaml (same file the website uses). The app ships
// a copy (assets/methods.json) for a first launch offline; the latest one is
// loaded from the CDN mirror (lib/service/methods.ts) and used from then on.

export type MethodDef = {
  label: string;
  fajr_angle: number;
  isha_angle?: number;
  isha_interval?: number;
  maghrib_angle?: number;
  adjustments?: Partial<
    Record<keyof CalculationParameters["methodAdjustments"], number>
  >;
  rounding?: "nearest" | "up";
};

export type MethodsDoc = {
  default: string;
  methods: Record<string, MethodDef>;
  countries: Record<string, string>;
};

let current = bundled as MethodsDoc;

// Ignores a document that doesn't look right, keeping the one in use.
export function setMethods(doc: unknown) {
  const d = doc as MethodsDoc | null;
  if (!d?.methods || !d.countries || !d.methods[d.default]) return;
  current = d;
}

export function methodFor(countryIso: string | null): {
  name: string;
  def: MethodDef;
} {
  const name = (countryIso && current.countries[countryIso]) || current.default;
  const def = current.methods[name] ?? current.methods[current.default];
  return { name, def };
}

// The method as adhan parameters (start from "Other" and set each value;
// this reproduces adhan's built-in methods of the same name).
export function toParams(def: MethodDef): CalculationParameters {
  const params = CalculationMethod.Other();
  params.fajrAngle = def.fajr_angle;
  params.ishaAngle = def.isha_angle ?? 0;
  params.ishaInterval = def.isha_interval ?? 0;
  params.maghribAngle = def.maghrib_angle ?? 0;
  params.methodAdjustments = {
    ...params.methodAdjustments,
    ...def.adjustments,
  };
  if (def.rounding === "up") params.rounding = Rounding.Up;
  return params;
}
