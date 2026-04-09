import test from "node:test";
import assert from "node:assert/strict";
import { addUtmSource, applyCalendlyEventType, createContactOptions } from "../lib/contact.js";

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

test("createContactOptions applies UTM source to outbound contact links", () => {
  const original = {
    CONTACT_UTM_SOURCE: process.env.CONTACT_UTM_SOURCE,
    CALENDLY_URL: process.env.CALENDLY_URL,
    ZOOM_BOOKING_URL: process.env.ZOOM_BOOKING_URL,
    LINKEDIN_URL: process.env.LINKEDIN_URL,
  };
  process.env.CONTACT_UTM_SOURCE = "ask-hannah-mcp";
  process.env.CALENDLY_URL = "https://calendly.com/your-handle/intro";
  process.env.ZOOM_BOOKING_URL = "https://zoom.us/meeting/register/abc123";
  process.env.LINKEDIN_URL = "https://www.linkedin.com/in/example-profile";

  const contact = createContactOptions({
    email: "test@example.com",
    linkedin: "https://www.linkedin.com/in/fallback",
  });

  assert.match(contact.calendlyUrl, /utm_source=ask-hannah-mcp/);
  assert.match(contact.zoomBookingUrl, /utm_source=ask-hannah-mcp/);
  assert.match(contact.linkedinUrl, /utm_source=ask-hannah-mcp/);

  process.env.CONTACT_UTM_SOURCE = original.CONTACT_UTM_SOURCE;
  process.env.CALENDLY_URL = original.CALENDLY_URL;
  process.env.ZOOM_BOOKING_URL = original.ZOOM_BOOKING_URL;
  process.env.LINKEDIN_URL = original.LINKEDIN_URL;
});
