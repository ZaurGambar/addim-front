import { TYPE_INFO } from "@/utils/mock/baku";

export const typeInfo = (summary, i) => {
  const t = summary?.types?.[i];
  return TYPE_INFO[t?.code] || { name: `Tip ${i + 1}`, d: "", rx: "" };
};

export const overlap4Pop = (summary) => summary.overlap_pop.slice(4).reduce((a, b) => a + b, 0);
