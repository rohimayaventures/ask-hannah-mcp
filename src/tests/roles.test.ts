import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRoleFocus } from "../lib/roles.js";

test("normalizeRoleFocus maps conversational aliases", () => {
  assert.equal(normalizeRoleFocus("conversational-ai-pm"), "ai-pm");
  assert.equal(normalizeRoleFocus("conversational-ai-ux-design"), "ux-ai");
  assert.equal(normalizeRoleFocus("general-ai-product"), "general-ai");
});

test("normalizeRoleFocus defaults unknown values", () => {
  assert.equal(normalizeRoleFocus("unknown-focus"), "general-ai");
});
