import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ANTHROPIC_GENERATION_MODEL,
  getCoverLetterGenerationModel,
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
