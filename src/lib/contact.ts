type FreshnessData = {
  profileDataLastUpdated: string;
};

type ProfileContactDefaults = {
  email: string;
  linkedin: string;
};

export type ContactOptions = {
  email: string;
  calendlyUrl: string;
  zoomBookingUrl: string;
  linkedinUrl: string;
  preferredContactMethod: string;
  responseTimeHours: number;
  timezone: string;
  bookingCtaLabel: string;
  calendlyEventType: string;
};

export function getFreshness(dataFreshness: FreshnessData) {
  const todayUTC = new Date().toISOString().slice(0, 10);
  return {
    profileDataLastUpdated: process.env.PROFILE_DATA_LAST_UPDATED ?? dataFreshness.profileDataLastUpdated,
    mcpContentSetLastUpdated: process.env.MCP_CONTENT_SET_LAST_UPDATED ?? todayUTC,
  };
}

export function getServiceMeta(freshness: { mcpContentSetLastUpdated: string }) {
  const serviceVersion = process.env.APP_VERSION ?? process.env.npm_package_version ?? "1.0.0";
  const buildMeta = {
    buildDate: process.env.BUILD_DATE ?? freshness.mcpContentSetLastUpdated,
    gitSha: process.env.GIT_SHA ?? "unknown",
  };
  return { serviceVersion, buildMeta };
}

export function addUtmSource(url: string, source: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("utm_source")) parsed.searchParams.set("utm_source", source);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function applyCalendlyEventType(url: string, eventType: string, source: string): string {
  if (!url || !eventType) return url;
  try {
    const parsed = new URL(url);
    const cleanPath = parsed.pathname.replace(/\/$/, "");
    const eventSuffix = `/${eventType}`;
    if (!cleanPath.endsWith(eventSuffix)) {
      parsed.pathname = `${cleanPath}${eventSuffix}`;
    }
    return addUtmSource(parsed.toString(), source);
  } catch {
    const cleanUrl = url.replace(/\/$/, "");
    if (cleanUrl.endsWith(`/${eventType}`)) return addUtmSource(cleanUrl, source);
    return addUtmSource(`${cleanUrl}/${eventType}`, source);
  }
}

export function createContactOptions(profileDefaults: ProfileContactDefaults): ContactOptions {
  const contactTrackingSource = process.env.CALENDLY_UTM_SOURCE ?? "ask-hannah-mcp";
  const contactTimezone = process.env.CONTACT_TIMEZONE ?? "America/Denver";
  const bookingCtaLabel = process.env.BOOKING_CTA_LABEL ?? "Book a discovery call";
  const calendlyEventType = process.env.CALENDLY_EVENT_TYPE ?? "";

  let calendlyUrl = addUtmSource(process.env.CALENDLY_URL ?? "", contactTrackingSource);
  calendlyUrl = applyCalendlyEventType(calendlyUrl, calendlyEventType, contactTrackingSource);

  return {
    email: process.env.CONTACT_EMAIL ?? profileDefaults.email,
    calendlyUrl,
    zoomBookingUrl: process.env.ZOOM_BOOKING_URL ?? "",
    linkedinUrl: process.env.LINKEDIN_URL ?? profileDefaults.linkedin,
    preferredContactMethod: process.env.PREFERRED_CONTACT_METHOD ?? "calendly",
    responseTimeHours: parseInt(process.env.CONTACT_RESPONSE_TIME_HOURS ?? "24", 10),
    timezone: contactTimezone,
    bookingCtaLabel,
    calendlyEventType,
  };
}

export function collectContactConfigWarnings(contactOptions: ContactOptions): string[] {
  const warnings: string[] = [];

  if (!contactOptions.email || !contactOptions.email.includes("@")) {
    warnings.push("CONTACT_EMAIL is missing or does not look valid.");
  }

  if (!contactOptions.linkedinUrl || !/^https?:\/\//.test(contactOptions.linkedinUrl)) {
    warnings.push("LINKEDIN_URL is missing or not a valid absolute URL.");
  }

  if (!contactOptions.calendlyUrl && !contactOptions.zoomBookingUrl) {
    warnings.push("Neither CALENDLY_URL nor ZOOM_BOOKING_URL is configured. Booking CTA will fall back to email only.");
  }

  if (contactOptions.calendlyUrl && !/^https?:\/\//.test(contactOptions.calendlyUrl)) {
    warnings.push("CALENDLY_URL is set but not a valid absolute URL.");
  }

  if (contactOptions.zoomBookingUrl && !/^https?:\/\//.test(contactOptions.zoomBookingUrl)) {
    warnings.push("ZOOM_BOOKING_URL is set but not a valid absolute URL.");
  }

  if (!Number.isFinite(contactOptions.responseTimeHours) || contactOptions.responseTimeHours <= 0) {
    warnings.push("CONTACT_RESPONSE_TIME_HOURS should be a positive number.");
  }

  return warnings;
}
