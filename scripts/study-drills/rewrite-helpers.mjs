// Recontextualize an existing worked exercise without changing its numeric answers.
export const n = (x, d = 0) =>
  x.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
export const m = (x) => `${x < 0 ? "-" : ""}$${n(Math.abs(x), 2)}`;
export const p = (x, d = 1) => `${n(x, d)}%`;
const valueOf = (s) =>
  Number(
    s
      .replace(/,/g, "")
      .match(/-?\$?-?\d+(?:\.\d+)?/)?.[0]
      .replace("$", ""),
  );
export function rewrite(original, question, explanation, options = {}) {
  const oldUnit = original.numericAnswer.unit;
  const style =
    options.style ??
    (oldUnit.startsWith("USD")
      ? "money"
      : oldUnit.startsWith("%")
        ? "percent"
        : "number");
  const digits =
    options.digits ?? original.answer.match(/\.(\d+)/)?.[1].length ?? 0;
  const suffix = options.suffix ?? oldUnit.replace(/^(?:USD|%)\s*/, "");
  const fmt = (x) =>
    `${style === "money" ? m(x) : style === "percent" ? p(x, digits) : n(x, digits)}${suffix ? " " + suffix : ""}`;
  const result = {
    ...original,
    question,
    answer: fmt(original.numericAnswer.value),
    distractors: original.distractors.map((x) => fmt(valueOf(x))),
    numericAnswer: {
      value: original.numericAnswer.value,
      unit:
        style === "money"
          ? `USD${suffix ? " " + suffix : ""}`
          : style === "percent"
            ? `%${suffix ? " " + suffix : ""}`
            : suffix,
    },
  };
  const rounding = original.question.match(
    / Round to (?:the nearest cent|the nearest whole number|\d decimal places?)\.$/,
  )?.[0];
  if (rounding)
    result.question +=
      style === "money" && digits === 2
        ? " Round to the nearest cent."
        : ` Round to ${digits === 0 ? "the nearest whole number" : `${digits} decimal ${digits === 1 ? "place" : "places"}`}.`;
  result.explanation =
    typeof explanation === "function"
      ? explanation(result.answer)
      : explanation;
  return result;
}
export function replaceContext(original, pairs) {
  let out = { ...original, numericAnswer: { ...original.numericAnswer } };
  for (const key of ["question", "explanation"])
    for (const [a, b] of pairs) out[key] = out[key].replaceAll(a, b);
  return out;
}
