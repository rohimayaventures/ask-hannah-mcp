import type { CoverLetterDocument } from "./generation-schemas.js";

/** Deterministic Markdown from validated cover letter JSON. */
export function renderCoverLetterMarkdown(doc: CoverLetterDocument): string {
  const [a, b, c] = doc.paragraphs;
  const parts = [doc.salutation.trim(), "", a.trim(), "", b.trim(), "", c.trim(), "", doc.signOff.trim()];
  return parts.join("\n").trim() + "\n";
}
