import test from "node:test";
import assert from "node:assert/strict";
import type { CoverLetterDocument, ResumeDocument } from "../lib/generation-schemas.js";
import {
  parseCoverLetterAtsMode,
  parseResumeAtsMode,
  plainLineFromMarkdownLinkField,
  renderCoverLetterOutput,
  renderResumeOutput,
  stripInlineMarkdownForAts,
  textFormatForAtsMode,
} from "../lib/generation-ats-render.js";

const header = {
  name: "Hannah Kraulik Pagade",
  title: "AI PM",
  location: "CO",
  email: "h@example.com",
  portfolio: "[site](https://example.com)",
  linkedin: "[in](https://linkedin.com/in/x)",
  github: "[gh](https://github.com/x)",
};

const sampleResume: ResumeDocument = {
  summary: "I ship **products**.",
  skills: ["TypeScript", "MCP", "Strategy"],
  experience: [{ headline: "PM | Health", bullets: ["Built OrixLink"] }],
  projects: [{ name: "OrixLink AI", bullets: ["Live triage"] }],
  education: "MS AI, School, in progress",
};

test("parseResumeAtsMode accepts aliases", () => {
  assert.equal(parseResumeAtsMode(undefined), "markdown");
  assert.equal(parseResumeAtsMode("PLAIN"), "plain");
  assert.equal(parseResumeAtsMode("plaintext"), "plain");
  assert.equal(parseResumeAtsMode("dense"), "plain_dense");
  assert.equal(parseCoverLetterAtsMode("compact"), "plain_dense");
});

test("stripInlineMarkdownForAts removes bold", () => {
  assert.equal(stripInlineMarkdownForAts("a **b** c"), "a b c");
});

test("plainLineFromMarkdownLinkField expands markdown links", () => {
  assert.equal(plainLineFromMarkdownLinkField("[a](https://b)"), "a — https://b");
});

test("renderResumeOutput markdown preserves hash headings", () => {
  const md = renderResumeOutput("markdown", sampleResume, header, "Targeting: X at Y");
  assert.match(md, /^# Hannah Kraulik Pagade/m);
  assert.match(md, /\*\*AI PM\*\*/);
});

test("renderResumeOutput plain has no markdown headings and expands links", () => {
  const t = renderResumeOutput("plain", sampleResume, header, "Targeting: X at Y");
  assert.doesNotMatch(t, /^#/m);
  assert.doesNotMatch(t, /\*\*/);
  assert.match(t, /SUMMARY/);
  assert.match(t, /site — https:\/\/example\.com/);
  assert.match(t, /I ship products\./);
});

test("renderResumeOutput plain_dense is more compact than plain", () => {
  const a = renderResumeOutput("plain", sampleResume, header, "Targeting: X at Y");
  const b = renderResumeOutput("plain_dense", sampleResume, header, "Targeting: X at Y");
  assert.ok(b.length <= a.length);
});

test("renderCoverLetterOutput plain strips inline emphasis", () => {
  const doc: CoverLetterDocument = {
    salutation: "Dear Team,",
    paragraphs: ["**One**.", "Two.", "Three."],
    signOff: "Best,\nH",
  };
  const t = renderCoverLetterOutput("plain", doc);
  assert.doesNotMatch(t, /\*\*/);
  assert.match(t, /One\./);
});

test("textFormatForAtsMode", () => {
  assert.equal(textFormatForAtsMode("markdown"), "markdown");
  assert.equal(textFormatForAtsMode("plain"), "plain");
  assert.equal(textFormatForAtsMode("plain_dense"), "plain");
});
