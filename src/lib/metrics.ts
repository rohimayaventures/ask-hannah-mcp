export type MetricEvidenceTag =
  | "operational_leadership"
  | "usability_research"
  | "clinical_validation"
  | "commercial_signal"
  | "research_validated"
  | "live_product_observed";

export function metricEvidenceTag(metric: string, context: string): MetricEvidenceTag {
  const haystack = `${metric} ${context}`.toLowerCase();
  if (haystack.includes("clinical validation") || haystack.includes("clinical workup")) {
    return "clinical_validation";
  }
  if (
    haystack.includes("cost savings") ||
    haystack.includes("satisfaction improved") ||
    haystack.includes("audit success") ||
    haystack.includes("people led") ||
    haystack.includes("operational")
  ) {
    return "operational_leadership";
  }
  if (haystack.includes("interview") || haystack.includes("usability") || haystack.includes("sus")) {
    return "usability_research";
  }
  if (haystack.includes("pilot") || haystack.includes("monetized") || haystack.includes("conversion")) {
    return "commercial_signal";
  }
  if (haystack.includes("validation") || haystack.includes("study") || haystack.includes("scenario")) {
    return "research_validated";
  }
  if (haystack.includes("live") || haystack.includes("pilot") || haystack.includes("shipped")) {
    return "live_product_observed";
  }
  return "research_validated";
}

export function metricConfidenceNote(evidenceTag: MetricEvidenceTag): string {
  switch (evidenceTag) {
    case "clinical_validation":
      return "Validated against a real clinical scenario outcome.";
    case "commercial_signal":
      return "Indicates market or buyer response in a real-world setting.";
    case "usability_research":
      return "Derived from structured research or testing activity.";
    case "operational_leadership":
      return "Measured outcome tied to leadership and operational execution.";
    case "live_product_observed":
      return "Observed in a live product context.";
    default:
      return "Evidence-backed outcome from documented project or operations context.";
  }
}
