import test from "node:test";
import assert from "node:assert/strict";
import { metricConfidenceNote, metricEvidenceTag } from "../lib/metrics.js";

test("metricEvidenceTag classifies operational metrics", () => {
  const tag = metricEvidenceTag("Cost savings reached 500k", "Operational workflow redesign");
  assert.equal(tag, "operational_leadership");
});

test("metricConfidenceNote returns non-empty note", () => {
  const note = metricConfidenceNote("clinical_validation");
  assert.match(note, /Validated/);
});
