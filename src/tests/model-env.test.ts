import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ANTHROPIC_GENERATION_MODEL,
  DEFAULT_JD_EXTRACT_MODEL,
  getCoverLetterGenerationModel,
  getJdExtractModel,
  getResumeGenerationModel,
} from "../lib/model-env.js";

test("getResumeGenerationModel falls back to default when env unset", () => {
  const prevR = process.env.ANTHROPIC_MODEL_RESUME;
  const prevG = process.env.ANTHROPIC_MODEL;
  delete process.env.ANTHROPIC_MODEL_RESUME;
  delete process.env.ANTHROPIC_MODEL;
  try {
    assert.equal(getResumeGenerationModel(), DEFAULT_ANTHROPIC_GENERATION_MODEL);
  } finally {
    if (prevR !== undefined) process.env.ANTHROPIC_MODEL_RESUME = prevR;
    else delete process.env.ANTHROPIC_MODEL_RESUME;
    if (prevG !== undefined) process.env.ANTHROPIC_MODEL = prevG;
    else delete process.env.ANTHROPIC_MODEL;
  }
});

test("getJdExtractModel uses dedicated env then shared ANTHROPIC_MODEL", () => {
  const prevJ = process.env.ANTHROPIC_MODEL_JD_EXTRACT;
  const prevG = process.env.ANTHROPIC_MODEL;
  delete process.env.ANTHROPIC_MODEL_JD_EXTRACT;
  delete process.env.ANTHROPIC_MODEL;
  try {
    assert.equal(getJdExtractModel(), DEFAULT_JD_EXTRACT_MODEL);
    process.env.ANTHROPIC_MODEL = "shared-for-extract";
    assert.equal(getJdExtractModel(), "shared-for-extract");
    process.env.ANTHROPIC_MODEL_JD_EXTRACT = "jd-only";
    assert.equal(getJdExtractModel(), "jd-only");
  } finally {
    if (prevJ !== undefined) process.env.ANTHROPIC_MODEL_JD_EXTRACT = prevJ;
    else delete process.env.ANTHROPIC_MODEL_JD_EXTRACT;
    if (prevG !== undefined) process.env.ANTHROPIC_MODEL = prevG;
    else delete process.env.ANTHROPIC_MODEL;
  }
});

test("per-tool model env overrides shared ANTHROPIC_MODEL", () => {
  const prevR = process.env.ANTHROPIC_MODEL_RESUME;
  const prevC = process.env.ANTHROPIC_MODEL_COVER_LETTER;
  const prevG = process.env.ANTHROPIC_MODEL;
  process.env.ANTHROPIC_MODEL = "shared-model";
  process.env.ANTHROPIC_MODEL_RESUME = "resume-only";
  process.env.ANTHROPIC_MODEL_COVER_LETTER = "letter-only";
  try {
    assert.equal(getResumeGenerationModel(), "resume-only");
    assert.equal(getCoverLetterGenerationModel(), "letter-only");
  } finally {
    if (prevR !== undefined) process.env.ANTHROPIC_MODEL_RESUME = prevR;
    else delete process.env.ANTHROPIC_MODEL_RESUME;
    if (prevC !== undefined) process.env.ANTHROPIC_MODEL_COVER_LETTER = prevC;
    else delete process.env.ANTHROPIC_MODEL_COVER_LETTER;
    if (prevG !== undefined) process.env.ANTHROPIC_MODEL = prevG;
    else delete process.env.ANTHROPIC_MODEL;
  }
});
