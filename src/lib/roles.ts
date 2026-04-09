export type CanonicalRoleFocus =
  | "founding-pm"
  | "head-of-product"
  | "ai-pm"
  | "ux-ai"
  | "healthcare-ai"
  | "general-ai";

export const canonicalRoleLabels: Record<CanonicalRoleFocus, string> = {
  "founding-pm": "Founding PM",
  "head-of-product": "Head of Product",
  "ai-pm": "AI Product Manager",
  "ux-ai": "Conversational AI UX Design",
  "healthcare-ai": "Healthcare AI Product Lead",
  "general-ai": "General AI Product",
};

export function normalizeRoleFocus(input: string): CanonicalRoleFocus {
  if (input === "conversational-ai-pm" || input === "pm" || input === "conversational-ai" || input === "ai-pm") {
    return "ai-pm";
  }
  if (input === "conversational-ai-ux-design" || input === "ux-design" || input === "ux-ai") {
    return "ux-ai";
  }
  if (input === "general-ai-product" || input === "general") {
    return "general-ai";
  }
  if (input === "founding-pm" || input === "head-of-product" || input === "healthcare-ai" || input === "general-ai") {
    return input;
  }
  return "general-ai";
}
