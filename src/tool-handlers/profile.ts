type Freshness = {
  profileDataLastUpdated: string;
  mcpContentSetLastUpdated: string;
};

export function handleGetProfile(
  args: { format: "markdown" | "json" | "summary" },
  deps: { profile: any; contactOptions: any; freshness: Freshness }
) {
  const { profile, contactOptions, freshness } = deps;
  const { format } = args;
  const data = {
    name: profile.name,
    positioning: profile.positioning,
    summary: profile.summary,
    currentRole: profile.currentRole,
    location: profile.location,
    openToRelocation: profile.openToRelocation,
    preferredLocations: profile.preferredLocations,
    education: profile.education,
    certifications: profile.certifications,
    targetRoles: profile.targetRoles,
    contact: { email: profile.email, portfolio: profile.portfolio, linkedin: profile.linkedin, github: profile.github },
    contactOptions,
    compensation: profile.compensation,
    availability: profile.availability,
    profileDataLastUpdated: freshness.profileDataLastUpdated,
    mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
  };

  if (format === "json") {
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data };
  }

  const md = `# ${profile.name}

**${profile.title}**

## Who She Is
${profile.summary}

## Background
${profile.background.summary}

## Current Role
${profile.currentRole}

## Education
**${profile.education.degree}** — ${profile.education.school}
Status: ${profile.education.status}, expected ${profile.education.expected}
Relevant coursework: ${profile.education.relevantCoursework.join(", ")}

## Certifications
${profile.certifications.map((c: string) => `- ${c}`).join("\n")}

## Target Roles
${profile.targetRoles.map((r: string) => `- ${r}`).join("\n")}

## Compensation
${profile.compensation}

## Availability
${profile.availability}

## Contact
- Email: ${profile.email}
- Portfolio: ${profile.portfolio}
- LinkedIn: ${profile.linkedin}
- GitHub: ${profile.github}
- Preferred contact method: ${contactOptions.preferredContactMethod}
- Expected response time: within ${contactOptions.responseTimeHours} hours
- Time zone: ${contactOptions.timezone}
- Calendly: ${contactOptions.calendlyUrl || "Not configured"}
- Zoom booking: ${contactOptions.zoomBookingUrl || "Not configured"}
- LinkedIn: ${contactOptions.linkedinUrl}
- Email: ${contactOptions.email}

## Data Freshness
- Profile data last updated: ${freshness.profileDataLastUpdated}
- MCP content set last updated: ${freshness.mcpContentSetLastUpdated}`;

  return { content: [{ type: "text" as const, text: md }] };
}
