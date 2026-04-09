import type { CoverLetterDocument, ResumeDocument } from "./generation-schemas.js";
import { getResumePdfCtaLine, type ResumeProfileHeader, renderResumeMarkdown } from "./render-resume-markdown.js";
import { renderCoverLetterMarkdown } from "./render-cover-letter-markdown.js";

/** Phase 4: how the server serializes resume text after JSON validation. */
export type ResumeAtsMode = "markdown" | "plain" | "plain_dense";

/** Phase 4: how the server serializes cover letter text after JSON validation. */
export type CoverLetterAtsMode = "markdown" | "plain" | "plain_dense";

export function parseResumeAtsMode(raw: string | undefined): ResumeAtsMode {
  const v = raw?.trim().toLowerCase();
  if (v === "plain" || v === "plain_text" || v === "plaintext") return "plain";
  if (v === "plain_dense" || v === "dense" || v === "compact") return "plain_dense";
  return "markdown";
}

export function parseCoverLetterAtsMode(raw: string | undefined): CoverLetterAtsMode {
  const v = raw?.trim().toLowerCase();
  if (v === "plain" || v === "plain_text" || v === "plaintext") return "plain";
  if (v === "plain_dense" || v === "dense" || v === "compact") return "plain_dense";
  return "markdown";
}

export function textFormatForAtsMode(mode: ResumeAtsMode | CoverLetterAtsMode): "markdown" | "plain" {
  return mode === "markdown" ? "markdown" : "plain";
}

/** Remove common markdown inline wrappers from model or profile fragments. */
export function stripInlineMarkdownForAts(s: string): string {
  let out = s;
  out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
  out = out.replace(/\*([^*]+)\*/g, "$1");
  out = out.replace(/`([^`]+)`/g, "$1");
  return out;
}

/** Turn "[label](url)" into "label — url"; otherwise strip inline markdown. */
export function plainLineFromMarkdownLinkField(s: string): string {
  const trimmed = s.trim();
  const m = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/);
  if (m) return `${stripInlineMarkdownForAts(m[1])} — ${m[2]}`;
  return stripInlineMarkdownForAts(trimmed);
}

type PlainHeader = {
  name: string;
  title: string;
  location: string;
  email: string;
  portfolio: string;
  linkedin: string;
  github: string;
};

function toPlainHeader(header: ResumeProfileHeader): PlainHeader {
  return {
    name: stripInlineMarkdownForAts(header.name),
    title: stripInlineMarkdownForAts(header.title),
    location: stripInlineMarkdownForAts(header.location),
    email: stripInlineMarkdownForAts(header.email),
    portfolio: plainLineFromMarkdownLinkField(header.portfolio),
    linkedin: plainLineFromMarkdownLinkField(header.linkedin),
    github: plainLineFromMarkdownLinkField(header.github),
  };
}

function joinBlocks(blocks: string[], dense: boolean): string {
  const sep = dense ? "\n" : "\n\n";
  return blocks.filter((b) => b.length > 0).join(sep).trim() + "\n";
}

/** ATS-oriented plain text (no # headings, no bold). */
export function renderResumePlain(
  doc: ResumeDocument,
  header: ResumeProfileHeader,
  targetingLine: string,
  dense: boolean
): string {
  const h = toPlainHeader(header);
  const lines: string[] = [];
  lines.push(h.name.toUpperCase());
  lines.push("");
  lines.push(h.title);
  lines.push("");
  lines.push(`Location: ${h.location}`);
  lines.push(`Email: ${h.email}`);
  lines.push(`Portfolio: ${h.portfolio}`);
  lines.push(`LinkedIn: ${h.linkedin}`);
  lines.push(`GitHub: ${h.github}`);
  lines.push("");
  lines.push(stripInlineMarkdownForAts(targetingLine));

  const sections: string[] = [lines.join("\n")];

  sections.push(
    ["SUMMARY", stripInlineMarkdownForAts(doc.summary.trim())].join(dense ? "\n" : "\n\n")
  );

  const skillLines = doc.skills.map((s) => `- ${stripInlineMarkdownForAts(s.trim())}`);
  sections.push(["SKILLS", skillLines.join("\n")].join(dense ? "\n" : "\n\n"));

  const expParts: string[] = [];
  for (const block of doc.experience) {
    const head = stripInlineMarkdownForAts(block.headline.trim());
    const bs = block.bullets.map((b) => `- ${stripInlineMarkdownForAts(b.trim())}`);
    expParts.push([head, bs.join("\n")].join(dense ? "\n" : "\n\n"));
  }
  sections.push(["EXPERIENCE", expParts.join(dense ? "\n" : "\n\n")].join(dense ? "\n" : "\n\n"));

  const projParts: string[] = [];
  for (const p of doc.projects) {
    const title = stripInlineMarkdownForAts(p.name.trim());
    const bs = p.bullets.map((b) => `- ${stripInlineMarkdownForAts(b.trim())}`);
    projParts.push([title, bs.join("\n")].join(dense ? "\n" : "\n\n"));
  }
  sections.push(["PROJECTS", projParts.join(dense ? "\n" : "\n\n")].join(dense ? "\n" : "\n\n"));

  sections.push(
    ["EDUCATION", stripInlineMarkdownForAts(doc.education.trim())].join(dense ? "\n" : "\n\n")
  );

  sections.push(stripInlineMarkdownForAts(getResumePdfCtaLine()));

  return joinBlocks(sections, dense);
}

export function renderCoverLetterPlain(doc: CoverLetterDocument, dense: boolean): string {
  const sal = stripInlineMarkdownForAts(doc.salutation.trim());
  const [a, b, c] = doc.paragraphs.map((p) => stripInlineMarkdownForAts(p.trim()));
  const sign = stripInlineMarkdownForAts(doc.signOff.trim());
  const sep = dense ? "\n" : "\n\n";
  return [sal, a, b, c, sign].join(sep).trim() + "\n";
}

export function renderResumeOutput(
  mode: ResumeAtsMode,
  doc: ResumeDocument,
  header: ResumeProfileHeader,
  targetingLine: string
): string {
  if (mode === "markdown") {
    return renderResumeMarkdown(doc, header, targetingLine);
  }
  return renderResumePlain(doc, header, targetingLine, mode === "plain_dense");
}

export function renderCoverLetterOutput(mode: CoverLetterAtsMode, doc: CoverLetterDocument): string {
  if (mode === "markdown") {
    return renderCoverLetterMarkdown(doc);
  }
  return renderCoverLetterPlain(doc, mode === "plain_dense");
}
