import test from "node:test";
import assert from "node:assert/strict";
import {
  formatExtractionForPrompt,
  parseJobDescriptionExtractionJson,
  stripModelJsonFences,
} from "../lib/jd-extract.js";

test("stripModelJsonFences removes json code fence", () => {
  const wrapped = "```json\n{\"roleSummary\":\"PM\"}\n```";
  assert.equal(stripModelJsonFences(wrapped).trim(), "{\"roleSummary\":\"PM\"}");
});

test("parseJobDescriptionExtractionJson parses minimal object", () => {
  const json = JSON.stringify({
    roleSummary: "Lead PM for AI",
    mustHaveRequirements: ["MCP experience"],
    niceToHaveRequirements: [],
    keySkillsOrStack: ["TypeScript"],
    seniorityAndScope: "Senior",
    domainOrIndustry: "B2B",
    constraints: [],
    tailoringNotes: "Emphasize shipping",
  });
  const parsed = parseJobDescriptionExtractionJson(json);
  assert.equal(parsed.roleSummary, "Lead PM for AI");
  assert.equal(parsed.mustHaveRequirements[0], "MCP experience");
});

test("parseJobDescriptionExtractionJson accepts fenced model output", () => {
  const inner = JSON.stringify({
    roleSummary: "X",
    mustHaveRequirements: [],
    niceToHaveRequirements: [],
    keySkillsOrStack: [],
    seniorityAndScope: "",
    domainOrIndustry: "",
    constraints: [],
    tailoringNotes: "",
  });
  const parsed = parseJobDescriptionExtractionJson("```" + inner + "```");
  assert.equal(parsed.roleSummary, "X");
});

test("formatExtractionForPrompt renders headings", () => {
  const md = formatExtractionForPrompt({
    roleSummary: "PM",
    mustHaveRequirements: ["A"],
    niceToHaveRequirements: [],
    keySkillsOrStack: ["B"],
    seniorityAndScope: "Senior",
    domainOrIndustry: "Fintech",
    constraints: [],
    tailoringNotes: "Note",
  });
  assert.match(md, /### Role summary/);
  assert.match(md, /### Must-have signals/);
  assert.match(md, /### Skills \/ stack emphasized/);
});
