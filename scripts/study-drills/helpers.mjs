/** Authoring helpers for deterministic, worked calculation exercises. */
export const round = (value, digits = 2) => Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON * Math.max(1, Math.abs(value))) * 10 ** digits) / 10 ** digits;
export const num = (value, digits = 0) => round(value, digits).toLocaleString('en-US', {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
});
export const money = (value, digits = 2) => `${value < 0 ? '-' : ''}$${num(Math.abs(value), digits)}`;
export const pct = (value, digits = 1) => `${num(value, digits)}%`;
export const pick = (values, variant, offset = 0) => values[(variant + offset) % values.length];

export function formatValue(value, { style = 'money', digits = 2, suffix = '' } = {}) {
  const text = style === 'money' ? money(value, digits) : style === 'percent' ? pct(value, digits) : num(value, digits);
  return suffix ? `${text} ${suffix}` : text;
}

/**
 * Each family provides its own plausible mistakes and worked explanation.
 * Values are in displayed units (a percentage of 12 means 12%, not 0.12).
 * Supply extra mistake candidates if some can coincide at certain inputs.
 */
export function numeric(question, value, mistakes, explanation, options = {}) {
  const { style = 'money', digits = 2, suffix = '' } = options;
  if (![value, ...mistakes].every(Number.isFinite)) throw new Error(`Non-finite value: ${question}`);
  const answer = formatValue(value, options);
  const distractors = [...new Set(mistakes.map(mistake => formatValue(mistake, options)))].filter(text => text !== answer).slice(0, 3);
  if (distractors.length !== 3) throw new Error(`Need three distinct mistakes for: ${question}`);
  let prompt = question;
  if (Math.abs(value - round(value, digits)) > 1e-8) {
    prompt += style === 'money' && digits === 2
      ? ' Round to the nearest cent.'
      : ` Round to ${digits === 0 ? 'the nearest whole number' : `${digits} decimal ${digits === 1 ? 'place' : 'places'}`}.`;
  }
  return {
    question: prompt, answer, distractors, explanation,
    numericAnswer: { value: round(value, digits), unit: style === 'money' ? `USD${suffix ? ` ${suffix}` : ''}` : style === 'percent' ? `%${suffix ? ` ${suffix}` : ''}` : suffix },
  };
}
