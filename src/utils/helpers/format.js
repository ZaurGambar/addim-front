export const fmt = (n) => (n == null || Number.isNaN(n) ? "–" : Number(n).toLocaleString("az-Latn-AZ"));

export const fmtN = (v) => {
  if (v == null) return "–";
  if (Math.abs(v) >= 1000) return fmt(Math.round(v));
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(Math.abs(v) < 1 ? 2 : 1);
};

// CSS dəyişənləri keşlənir: hər hücrə üçün getComputedStyle çağırmaq xəritəni yavaşladırdı.
// Tema (data-theme) dəyişəndə keş təmizlənir.
const varCache = new Map();
if (typeof MutationObserver !== "undefined") {
  new MutationObserver(() => varCache.clear()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
export const cssVar = (name) => {
  let v = varCache.get(name);
  if (v === undefined) {
    v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    varCache.set(name, v);
  }
  return v;
};

export const RAMP = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7"];
export const GAP_RAMP = ["--g1", "--g2", "--g3", "--g4"];

export const scoreBin = (s) => (s < 20 ? 0 : s < 30 ? 1 : s < 40 ? 2 : s < 50 ? 3 : s < 60 ? 4 : s < 70 ? 5 : 6);

export const quantileBreaks = (vals, n = 7) => {
  const v = vals.filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return [];
  const q = (p) => v[Math.min(v.length - 1, Math.floor(p * (v.length - 1)))];
  return Array.from({ length: n - 1 }, (_, i) => q((i + 1) / n));
};

export const binColor = (v, breaks) => {
  if (v == null) return "transparent";
  let i = 0;
  while (i < breaks.length && v > breaks[i]) i++;
  return cssVar(RAMP[i]);
};

const hex = (h) => h.replace("#", "").match(/\w\w/g).map((x) => parseInt(x, 16));
const mix = (a, b, t) => {
  const A = hex(a);
  const B = hex(b);
  return "#" + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, "0")).join("");
};

export const divColor = (v) => {
  const mid = cssVar("--d-mid");
  return v >= 0 ? mix(mid, cssVar("--d-pos"), Math.min(1, v)) : mix(mid, cssVar("--d-neg"), Math.min(1, -v));
};

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
