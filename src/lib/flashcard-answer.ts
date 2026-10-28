import type { Flashcard } from "../types";

/** Keep units meaningful while accepting ordinary numeric formatting. */
export function checkCalculationAnswer(
  input: string,
  expected: NonNullable<Flashcard["numericAnswer"]>,
): boolean {
  let text = input.normalize("NFKC").trim().replace(/−/g, "-");
  const unit = expected.unit.toLowerCase().trim();
  const baseUnit = /^usd(?:\s|$)/.test(unit)
    ? "usd"
    : /^%(?:\s|$)/.test(unit)
      ? "%"
      : "";
  const dimension = baseUnit ? unit.slice(baseUnit.length).trim() : unit;
  const currency = /^[+-]?\$/.test(text) || /^USD\s/i.test(text);
  if (currency && baseUnit !== "usd") return false;
  text = text.replace(/^([+-]?)\$\s*/, "$1").replace(/^USD\s+/i, "");
  const match = text.match(
    /^([+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.*?)$/i,
  );
  if (!match) return false;
  const suffix = match[2]!.toLowerCase().replace(/\s+/g, " ").trim();
  const baseLabels =
    baseUnit === "usd"
      ? ["usd", "dollar", "dollars"]
      : baseUnit === "%"
        ? ["%", "percent"]
        : [];
  const dimensions = dimension ? [dimension, dimension.replace(/s$/, "")] : [];
  const acceptableUnits = [
    "",
    ...baseLabels,
    ...dimensions,
    ...baseLabels.flatMap((label) =>
      dimensions.map((suffix) => `${label} ${suffix}`),
    ),
  ];
  if (!acceptableUnits.includes(suffix)) return false;
  const value = Number(match[1]!.replaceAll(",", ""));
  return Number.isFinite(value) && value === expected.value;
}
