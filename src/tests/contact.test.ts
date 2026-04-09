import test from "node:test";
import assert from "node:assert/strict";
import { addUtmSource, applyCalendlyEventType } from "../lib/contact.js";

test("addUtmSource appends source only once", () => {
  const url = "https://calendly.com/your-handle/intro";
  const first = addUtmSource(url, "ask-hannah-mcp");
  const second = addUtmSource(first, "ask-hannah-mcp");
  assert.match(first, /utm_source=ask-hannah-mcp/);
  assert.equal(first, second);
});

test("applyCalendlyEventType does not double-append event path", () => {
  const initial = "https://calendly.com/your-handle/20min-intro";
  const once = applyCalendlyEventType(initial, "20min-intro", "ask-hannah-mcp");
  const twice = applyCalendlyEventType(once, "20min-intro", "ask-hannah-mcp");
  assert.equal(once, twice);
  assert.match(once, /20min-intro/);
});
