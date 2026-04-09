import test from "node:test";
import assert from "node:assert/strict";
import type { CoverLetterDocument, ResumeDocument } from "../lib/generation-schemas.js";
import {
  parseCoverLetterDocumentFromModelText,
  parseResumeDocumentFromModelText,
} from "../lib/generation-document-parse.js";
import { renderCoverLetterMarkdown } from "../lib/render-cover-letter-markdown.js";
import { renderResumeMarkdown } from "../lib/render-resume-markdown.js";

const validResume: ResumeDocument = {
  summary: "I build AI products that ship.",
  skills: ["TypeScript", "MCP", "Product strategy"],
  experience: [{ headline: "PM | Health AI", bullets: ["Shipped OrixLink in 90 days"] }],
  projects: [{ name: "OrixLink AI", bullets: ["Clinical triage live"] }],
  education: "MS AI, University of Colorado Boulder, in progress, expected 2026",
};

test("parseResumeDocumentFromModelText accepts raw JSON", () => {
  const r = parseResumeDocumentFromModelText(JSON.stringify(validResume));
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.summary, validResume.summary);
});

test("parseResumeDocumentFromModelText rejects invalid JSON", () => {
  const r = parseResumeDocumentFromModelText("not json");
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, "ERR_RESUME_JSON");
});

test("parseResumeDocumentFromModelText rejects schema mismatch", () => {
  const r = parseResumeDocumentFromModelText(JSON.stringify({ summary: "x" }));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, "ERR_RESUME_SCHEMA");
});

const validLetter: CoverLetterDocument = {
  salutation: "Dear Team,",
  paragraphs: ["One.", "Two.", "Three."],
  signOff: "Best,\nHannah",
};

test("parseCoverLetterDocumentFromModelText accepts fenced JSON", () => {
  const r = parseCoverLetterDocumentFromModelText("```json\n" + JSON.stringify(validLetter) + "\n```");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.paragraphs.length, 3);
});

test("parseCoverLetterDocumentFromModelText rejects wrong paragraph count", () => {
  const r = parseCoverLetterDocumentFromModelText(
    JSON.stringify({ salutation: "Hi,", paragraphs: ["a", "b"], signOff: "x" })
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, "ERR_COVER_LETTER_SCHEMA");
});

test("renderResumeMarkdown includes verified header and sections", () => {
  const md = renderResumeMarkdown(validResume, {
    name: "Hannah Kraulik Pagade",
    title: "AI PM",
    location: "CO",
    email: "h@example.com",
    portfolio: "[site](https://example.com)",
    linkedin: "[in](https://linkedin.com/in/x)",
    github: "[gh](https://github.com/x)",
  }, "Targeting: PM at Acme");
  assert.match(md, /^# Hannah Kraulik Pagade/m);
  assert.match(md, /## Summary/);
  assert.match(md, /## Skills/);
  assert.match(md, /## Experience/);
  assert.match(md, /## Projects/);
  assert.match(md, /## Education/);
  assert.match(md, /PDF available|resume-builder/);
});

test("renderCoverLetterMarkdown joins salutation and paragraphs", () => {
  const md = renderCoverLetterMarkdown(validLetter);
  assert.match(md, /^Dear Team,/m);
  assert.match(md, /One\./);
  assert.match(md, /Best,/m);
});
