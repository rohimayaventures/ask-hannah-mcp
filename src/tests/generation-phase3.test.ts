import test from "node:test";
import assert from "node:assert/strict";
import type { CoverLetterDocument, ResumeDocument } from "../lib/generation-schemas.js";
import {
  buildVerifiedFactCorpus,
  normalizeForFactScan,
  verifyCoverLetterDocumentFacts,
  verifyResumeDocumentFacts,
} from "../lib/generation-fact-verify.js";
import { isGenerationFactVerifyEnabled } from "../lib/model-env.js";
import { metrics, profile, projects, skills, voiceAnswers } from "../hannah-data.js";

const corpusDeps = { profile, metrics, projects, skills, voiceAnswers };
const realCorpus = buildVerifiedFactCorpus(corpusDeps);

test("buildVerifiedFactCorpus includes known metric text", () => {
  assert.match(realCorpus, /\$1\.2m/);
  assert.match(realCorpus, /87%/);
});

test("normalizeForFactScan lowercases and collapses whitespace", () => {
  assert.equal(normalizeForFactScan("  Foo   Bar  "), "foo bar");
});

test("verifyResumeDocumentFacts passes for grounded sample against real corpus", () => {
  const doc: ResumeDocument = {
    summary: "I build AI products that ship across healthcare and fintech.",
    skills: ["MCP SDK", "Conversation design", "TypeScript"],
    experience: [
      {
        headline: "Operations leadership | regulated environments",
        bullets: [
          "Delivered $1.2M cost savings through evidence-based workflow analysis.",
          "Led 130+ people in a HIPAA-regulated environment.",
        ],
      },
    ],
    projects: [
      {
        name: "OrixLink AI",
        bullets: ["Shipped live triage product in under 90 days with Stripe and OAuth."],
      },
    ],
    education: "MS, Artificial Intelligence and Machine Learning, University of Colorado Boulder, in progress, expected 2026",
  };
  const r = verifyResumeDocumentFacts(doc, realCorpus);
  assert.equal(r.ok, true);
});

test("verifyResumeDocumentFacts rejects invented currency", () => {
  const doc: ResumeDocument = {
    summary: "I ship outcomes.",
    skills: ["A", "B", "C"],
    experience: [{ headline: "PM", bullets: ["Saved the company $99M overnight."] }],
    projects: [{ name: "OrixLink AI", bullets: ["Live product."] }],
    education: "MS AI, CU Boulder, in progress",
  };
  const r = verifyResumeDocumentFacts(doc, realCorpus);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.code, "ERR_RESUME_FACT_DRIFT");
    assert.match(r.hint, /unverified quantitative claim/i);
  }
});

test("verifyResumeDocumentFacts rejects forbidden references", () => {
  const doc: ResumeDocument = {
    summary: "I worked with Pagade Ventures on strategy.",
    skills: ["A", "B", "C"],
    experience: [{ headline: "PM", bullets: ["Shipped."] }],
    projects: [{ name: "OrixLink AI", bullets: ["Live."] }],
    education: "MS AI, CU Boulder, in progress",
  };
  const r = verifyResumeDocumentFacts(doc, realCorpus);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, "ERR_RESUME_FACT_DRIFT");
});

test("verifyResumeDocumentFacts rejects 15 years framing", () => {
  const doc: ResumeDocument = {
    summary: "I have 15 years of experience in product.",
    skills: ["A", "B", "C"],
    experience: [{ headline: "PM", bullets: ["Shipped."] }],
    projects: [{ name: "OrixLink AI", bullets: ["Live."] }],
    education: "MS AI, CU Boulder, in progress",
  };
  const r = verifyResumeDocumentFacts(doc, realCorpus);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.hint, /17 years/i);
});

test("verifyCoverLetterDocumentFacts uses same rules", () => {
  const okLetter: CoverLetterDocument = {
    salutation: "Dear Team,",
    paragraphs: [
      "I build AI products that ship.",
      "I care about outcomes like the 96% regulatory audit success rate in verified operations data.",
      "I would love to talk.",
    ],
    signOff: "Best,\nHannah",
  };
  assert.equal(verifyCoverLetterDocumentFacts(okLetter, realCorpus).ok, true);

  const badLetter: CoverLetterDocument = {
    salutation: "Dear Team,",
    paragraphs: ["One.", "We grew revenue by 50%.", "Three."],
    signOff: "Best,\nHannah",
  };
  const br = verifyCoverLetterDocumentFacts(badLetter, realCorpus);
  assert.equal(br.ok, false);
  if (!br.ok) assert.equal(br.code, "ERR_COVER_LETTER_FACT_DRIFT");
});

test("isGenerationFactVerifyEnabled defaults true and respects GENERATION_FACT_VERIFY_ENABLED=0", () => {
  const prev = process.env.GENERATION_FACT_VERIFY_ENABLED;
  delete process.env.GENERATION_FACT_VERIFY_ENABLED;
  try {
    assert.equal(isGenerationFactVerifyEnabled(), true);
    process.env.GENERATION_FACT_VERIFY_ENABLED = "0";
    assert.equal(isGenerationFactVerifyEnabled(), false);
    process.env.GENERATION_FACT_VERIFY_ENABLED = "false";
    assert.equal(isGenerationFactVerifyEnabled(), false);
  } finally {
    if (prev !== undefined) process.env.GENERATION_FACT_VERIFY_ENABLED = prev;
    else delete process.env.GENERATION_FACT_VERIFY_ENABLED;
  }
});
