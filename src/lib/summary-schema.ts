import { z } from "zod";

export const SummarySchema = z.object({
  covered: z.array(z.string()),
  keyTerms: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
});

export type Summary = z.infer<typeof SummarySchema>;

/** Validates stored/returned JSON. Returns null if it doesn't match the schema. */
export function parseSummary(raw: unknown): Summary | null {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const result = SummarySchema.safeParse(value);
  if (!result.success) return null;
  const clean = (list: string[], max: number) =>
    list.map((s) => s.trim()).filter(Boolean).slice(0, max);
  return {
    covered: clean(result.data.covered, 12),
    keyTerms: clean(result.data.keyTerms, 15),
    questionsToAsk: clean(result.data.questionsToAsk, 6),
    confidence: result.data.confidence,
  };
}
