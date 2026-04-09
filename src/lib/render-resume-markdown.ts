import type { ResumeDocument } from "./generation-schemas.js";

export type ResumeProfileHeader = {
  name: string;
  title: string;
  location: string;
  email: string;
  portfolio: string;
  linkedin: string;
  github: string;
};

export function getResumePdfCtaLine(): string {
  const line = process.env.RESUME_PDF_CTA_LINE?.trim();
  return line && line.length > 0
    ? line
    : "Full downloadable PDF available at hannahkraulikpagade.com/resume-builder";
}

/** Deterministic Markdown from validated resume JSON plus verified profile header. */
export function renderResumeMarkdown(
  doc: ResumeDocument,
  header: ResumeProfileHeader,
  targetingLine: string
): string {
  const lines: string[] = [];
  lines.push(`# ${header.name}`);
  lines.push("");
  lines.push(`**${header.title}**`);
  lines.push("");
  lines.push(`**Location:** ${header.location}`);
  lines.push(`**Email:** ${header.email}`);
  lines.push(`**Portfolio:** ${header.portfolio}`);
  lines.push(`**LinkedIn:** ${header.linkedin}`);
  lines.push(`**GitHub:** ${header.github}`);
  lines.push("");
  lines.push(`*${targetingLine}*`);
  lines.push("");
  lines.push("## Summary");
  lines.push(doc.summary.trim());
  lines.push("");
  lines.push("## Skills");
  for (const s of doc.skills) {
    lines.push(`- ${s.trim()}`);
  }
  lines.push("");
  lines.push("## Experience");
  for (const block of doc.experience) {
    lines.push(`### ${block.headline.trim()}`);
    lines.push("");
    for (const b of block.bullets) {
      lines.push(`- ${b.trim()}`);
    }
    lines.push("");
  }
  lines.push("## Projects");
  for (const p of doc.projects) {
    lines.push(`### ${p.name.trim()}`);
    lines.push("");
    for (const b of p.bullets) {
      lines.push(`- ${b.trim()}`);
    }
    lines.push("");
  }
  lines.push("## Education");
  lines.push(doc.education.trim());
  lines.push("");
  lines.push(getResumePdfCtaLine());
  return lines.join("\n").trim() + "\n";
}
