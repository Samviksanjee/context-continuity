/* Shared human-controlled AI contract (A11Y-09). ContextOS suggestions are
 * advisory: they are never executed automatically, they surface uncertainty in
 * plain language (no false precision), and the user stays in control. These
 * helpers are framework-free so both the app and tests can use them. */

export type ConfidenceBand = "high" | "moderate" | "low" | "unknown";

/** Parses a confidence value such as "94%" or 0.94 or 94 into a 0-100 number. */
export function parseConfidence(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    const scaled = value > 0 && value <= 1 ? value * 100 : value;
    return clampPercent(scaled);
  }
  const match = value.match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;
  return clampPercent(Number(match[0]));
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function confidenceBand(confidence: number | undefined): ConfidenceBand {
  if (confidence === undefined) return "unknown";
  if (confidence >= 85) return "high";
  if (confidence >= 65) return "moderate";
  return "low";
}

/** Plain-language uncertainty, deliberately avoiding an authoritative-sounding number. */
export function uncertaintyPhrase(confidence: number | undefined): string {
  switch (confidenceBand(confidence)) {
    case "high":
      return "Higher confidence, but still worth verifying";
    case "moderate":
      return "Moderate confidence — verify the key detail";
    case "low":
      return "Low confidence — treat this as a hint";
    default:
      return "Confidence isn't calibrated — check the evidence yourself";
  }
}
