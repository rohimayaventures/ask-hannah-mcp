import Anthropic from "@anthropic-ai/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { z } from "zod";
import {
  profile,
  metrics,
  projects,
  skills,
  designSystems,
  voiceAnswers,
  anticipatedQuestions,
  dataFreshness,
} from "./hannah-data.js";

const server = new McpServer({ name: "ask-hannah-mcp-server", version: "1.0.0" });
const anthropic = new Anthropic();
const todayUTC = new Date().toISOString().slice(0, 10);
const freshness = {
  profileDataLastUpdated: process.env.PROFILE_DATA_LAST_UPDATED ?? dataFreshness.profileDataLastUpdated,
  mcpContentSetLastUpdated: process.env.MCP_CONTENT_SET_LAST_UPDATED ?? todayUTC,
};
const serviceVersion = process.env.APP_VERSION ?? process.env.npm_package_version ?? "1.0.0";
const buildMeta = {
  buildDate: process.env.BUILD_DATE ?? freshness.mcpContentSetLastUpdated,
  gitSha: process.env.GIT_SHA ?? "unknown",
};
const anonymizationNotice =
  "Some employer names are intentionally anonymized at this stage. Role scope, measurable outcomes, and context are provided. Full employer detail is shared during recruiter and hiring manager conversations.";
const documentProvenanceStatement =
  "Generated from verified profile and project data in this MCP. No fabricated employers, metrics, dates, or accomplishments are permitted.";

type CanonicalRoleFocus = "founding-pm" | "head-of-product" | "ai-pm" | "ux-ai" | "healthcare-ai" | "general-ai";

const canonicalRoleLabels: Record<CanonicalRoleFocus, string> = {
  "founding-pm": "Founding PM",
  "head-of-product": "Head of Product",
  "ai-pm": "AI Product Manager",
  "ux-ai": "Conversational AI UX Design",
  "healthcare-ai": "Healthcare AI Product Lead",
  "general-ai": "General AI Product",
};

function normalizeRoleFocus(input: string): CanonicalRoleFocus {
  if (input === "conversational-ai-pm" || input === "pm" || input === "conversational-ai" || input === "ai-pm") {
    return "ai-pm";
  }
  if (input === "conversational-ai-ux-design" || input === "ux-design" || input === "ux-ai") {
    return "ux-ai";
  }
  if (input === "general-ai-product" || input === "general") {
    return "general-ai";
  }
  if (input === "founding-pm" || input === "head-of-product" || input === "healthcare-ai" || input === "general-ai") {
    return input;
  }
  return "general-ai";
}

function metricEvidenceTag(
  metric: string,
  context: string
): "operational_leadership" | "usability_research" | "clinical_validation" | "commercial_signal" | "research_validated" | "live_product_observed" {
  const haystack = `${metric} ${context}`.toLowerCase();
  if (haystack.includes("clinical validation") || haystack.includes("clinical workup")) {
    return "clinical_validation";
  }
  if (
    haystack.includes("cost savings") ||
    haystack.includes("satisfaction improved") ||
    haystack.includes("audit success") ||
    haystack.includes("people led") ||
    haystack.includes("operational")
  ) {
    return "operational_leadership";
  }
  if (haystack.includes("interview") || haystack.includes("usability") || haystack.includes("sus")) {
    return "usability_research";
  }
  if (haystack.includes("pilot") || haystack.includes("monetized") || haystack.includes("conversion")) {
    return "commercial_signal";
  }
  if (haystack.includes("validation") || haystack.includes("study") || haystack.includes("scenario")) {
    return "research_validated";
  }
  if (haystack.includes("live") || haystack.includes("pilot") || haystack.includes("shipped")) {
    return "live_product_observed";
  }
  return "research_validated";
}

function metricConfidenceNote(evidenceTag: string): string {
  switch (evidenceTag) {
    case "clinical_validation":
      return "Validated against a real clinical scenario outcome.";
    case "commercial_signal":
      return "Indicates market or buyer response in a real-world setting.";
    case "usability_research":
      return "Derived from structured research or testing activity.";
    case "operational_leadership":
      return "Measured outcome tied to leadership and operational execution.";
    case "live_product_observed":
      return "Observed in a live product context.";
    default:
      return "Evidence-backed outcome from documented project or operations context.";
  }
}

function extractAnthropicText(content: Anthropic.Message["content"]): string {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
}

function buildGenerationError(kind: "resume" | "cover_letter", err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  let code = "ERR_GENERATION_FAILED";
  if (message.toLowerCase().includes("authentication") || message.includes("401")) code = "ERR_ANTHROPIC_AUTH";
  else if (message.toLowerCase().includes("rate") || message.includes("429")) code = "ERR_ANTHROPIC_RATE_LIMIT";
  else if (message.toLowerCase().includes("timeout")) code = "ERR_ANTHROPIC_TIMEOUT";
  const hint =
    "Check ANTHROPIC_API_KEY, confirm model availability, and retry with a shorter job description (3-6 key requirements).";
  const label = kind === "resume" ? "Resume" : "Cover letter";
  return `[${code}] ${label} generation failed: ${message}. ${hint}`;
}

// ── Tool 1: hannah_get_profile ───────────────────────────────────────────────

server.registerTool(
  "hannah_get_profile",
  {
    title: "Get Hannah's Profile",
    description: `Returns Hannah Kraulik Pagade's complete professional profile: positioning, background, current role, education, target roles, contact info, availability, and compensation approach. Use this first when someone asks who Hannah is, what she does, what she is looking for, or how to contact her.

Examples:
- "Who is Hannah?" / "What roles is she targeting?" / "How do I reach her?"
- Do not use for specific project details — use hannah_get_project_detail instead`,
    inputSchema: {
      format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ format }) => {
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
      compensation: profile.compensation,
      availability: profile.availability,
      profileDataLastUpdated: freshness.profileDataLastUpdated,
      mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
    };

    if (format === "json") {
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
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
${profile.certifications.map((c) => `- ${c}`).join("\n")}

## Target Roles
${profile.targetRoles.map((r) => `- ${r}`).join("\n")}

## Location
${profile.location}. Open to relocation. Preferred: ${profile.preferredLocations.join(", ")}.

## Availability
${profile.availability}

## Compensation
${profile.compensation}

## Contact
- Portfolio: ${profile.portfolio}
- LinkedIn: ${profile.linkedin}
- GitHub: ${profile.github}
- Email: ${profile.email}

## Data Freshness
- Profile data last updated: ${freshness.profileDataLastUpdated}
- MCP content set last updated: ${freshness.mcpContentSetLastUpdated}`;

    return { content: [{ type: "text", text: md }] };
  }
);

// ── Tool 2: hannah_list_projects ─────────────────────────────────────────────

server.registerTool(
  "hannah_list_projects",
  {
    title: "List Hannah's Projects",
    description: `Returns all of Hannah's portfolio projects with name, domain, status, tagline, live URL, tags, and summary. Use when someone asks what she has built, to see her portfolio, or to find a specific project. Filter by status to show only live products or current builds.

Examples:
- "What has Hannah built?" / "Show me her portfolio" / "Does she have live products?"
- After listing, use hannah_get_project_detail to go deeper on any specific project`,
    inputSchema: {
      status: z.enum(["all", "live", "building"]).default("all").describe("Filter by status"),
      format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ status, format }) => {
    const filtered = status === "all" ? projects : projects.filter((p) => p.status === status);

    if (format === "json") {
      const data = filtered.map((p) => ({
        slug: p.slug, name: p.name, domain: p.domain, status: p.status,
        tagline: p.tagline, liveUrl: p.liveUrl, tags: p.tags, summary: p.summary,
      }));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: { projects: data, count: data.length } };
    }

    const live = filtered.filter((p) => p.status === "live");
    const building = filtered.filter((p) => p.status === "building");
    const built = filtered.filter((p) => p.status === "built");

    let md = `# Hannah Kraulik Pagade — Portfolio\n\n${filtered.length} project${filtered.length !== 1 ? "s" : ""} shown.\n\n`;

    const renderProjects = (list: typeof projects, heading: string) => {
      if (!list.length) return "";
      let out = `## ${heading}\n\n`;
      for (const p of list) {
        out += `### ${p.name} (${p.domain})\n**${p.tagline}**\n\n${p.summary}\n\n`;
        if (p.liveUrl) out += `- Live at: ${p.liveUrl}\n`;
        if ("caseStudyUrl" in p && p.caseStudyUrl) out += `- Case study: ${p.caseStudyUrl}\n`;
        out += `- Tags: ${p.tags.join(", ")}\n\n---\n\n`;
      }
      return out;
    };

    md += renderProjects(live, "Live Products");
    md += renderProjects(building, "Currently Building");
    md += renderProjects(built, "Built");
    md += `*Use hannah_get_project_detail with a project slug to go deeper on any of these.*`;

    return { content: [{ type: "text", text: md }] };
  }
);

// ── Tool 3: hannah_get_project_detail ────────────────────────────────────────

server.registerTool(
  "hannah_get_project_detail",
  {
    title: "Get Project Detail",
    description: `Returns a complete deep-dive on a specific portfolio project: problem, summary, key decisions, tech stack, design system, role, and outcomes.

Available slugs: orixlink-ai, healthliteracy-ai, clearchannel-vestara, financelens-ai, laidoffrise-mcp, ask-hannah-mcp

Examples:
- "Tell me about OrixLink" / "What's in the ClearChannel case study?"
- "What stack does HealthLiteracy use?" / "What were the key decisions in FinanceLens?"`,
    inputSchema: {
      project: z
        .enum(["orixlink-ai", "healthliteracy-ai", "clearchannel-vestara", "financelens-ai", "laidoffrise-mcp", "ask-hannah-mcp"])
        .describe("Project slug"),
      format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ project, format }) => {
    const p = projects.find((proj) => proj.slug === project);
    if (!p) {
      return { isError: true, content: [{ type: "text", text: `Project '${project}' not found. Use hannah_list_projects to see available slugs.` }] };
    }

    if (format === "json") {
      return { content: [{ type: "text", text: JSON.stringify(p, null, 2) }], structuredContent: p };
    }

    let md = `# ${p.name} (${p.domain})\n**${p.tagline}**\n\n`;
    md += `Status: ${p.status === "live" ? "Live" : "In active development"}\n`;
    if (p.liveUrl) md += `Live at: ${p.liveUrl}\n`;
    if ("caseStudyUrl" in p && p.caseStudyUrl) md += `Case study: ${p.caseStudyUrl}\n`;
    md += `Role: ${p.role}\nTimeline: ${p.timeline}\n\n`;
    if ("problem" in p && p.problem) md += `## The Problem\n${p.problem}\n\n`;
    md += `## What It Is\n${p.summary}\n\n`;
    if ("keyDecisions" in p && p.keyDecisions && Array.isArray(p.keyDecisions) && p.keyDecisions.length > 0) {
      md += `## Key Product Decisions\n`;
      (p.keyDecisions as string[]).forEach((d, i) => { md += `${i + 1}. ${d}\n`; });
      md += `\n`;
    }
    md += `## Tech Stack\n`;
    if (p.stack.highlighted.length > 0) md += `Core: ${p.stack.highlighted.join(", ")}\n`;
    if (p.stack.standard.length > 0) md += `Additional: ${p.stack.standard.join(", ")}\n`;
    md += `\n`;
    if ("designSystem" in p && p.designSystem) md += `## Design System\n${p.designSystem}\n\n`;
    if ("proofPoint" in p && p.proofPoint) md += `## Proof Point\n${p.proofPoint}\n\n`;
    md += `## Key Outcome\n${p.keyOutcome}`;

    return { content: [{ type: "text", text: md }] };
  }
);

// ── Tool 4: hannah_get_metrics ───────────────────────────────────────────────

server.registerTool(
  "hannah_get_metrics",
  {
    title: "Get Hannah's Validated Metrics",
    description: `Returns Hannah's validated professional metrics across operations leadership and AI product work. All metrics are real and evidence-based. None are estimated or invented.

Use when someone asks about Hannah's impact, results, numbers, or proof of work.

Examples:
- "What results has Hannah achieved?" / "Show me her impact numbers"
- "What are her operations metrics?" / "What has she accomplished as a PM?"`,
    inputSchema: {
      category: z
        .enum(["all", "operations", "product"])
        .default("all")
        .describe("Filter by category. 'operations' returns leadership outcomes. 'product' returns AI product outcomes."),
      format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ category, format }) => {
    const opsMetrics = category === "product" ? [] : metrics.operations;
    const prodMetrics = category === "operations" ? [] : metrics.product;

    if (format === "json") {
      const operations = opsMetrics.map((m) => ({
        ...m,
        evidenceTag: metricEvidenceTag(m.metric, m.context),
        confidenceNote: metricConfidenceNote(metricEvidenceTag(m.metric, m.context)),
      }));
      const product = prodMetrics.map((m) => ({
        ...m,
        evidenceTag: metricEvidenceTag(m.metric, m.context),
        confidenceNote: metricConfidenceNote(metricEvidenceTag(m.metric, m.context)),
      }));
      const data = { operations, product, anonymizationNotice };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
    }

    let md = `# Hannah Kraulik Pagade — Validated Metrics\n\nAll metrics are real and verified. None are estimated or rounded.\n\n${anonymizationNotice}\n\n`;

    if (opsMetrics.length > 0) {
      md += `## Operations Leadership\n\n`;
      for (const m of opsMetrics) {
        md += `### ${m.metric}\n${m.context}\n`;
        if ("employer" in m && m.employer) md += `Employer: ${m.employer}\n`;
        if ("role" in m && m.role) md += `Role: ${m.role}\n`;
        if ("dates" in m && m.dates) md += `Period: ${m.dates}\n`;
        md += `\n`;
      }
    }

    if (prodMetrics.length > 0) {
      md += `## AI Product Work\n\n`;
      for (const m of prodMetrics) {
        md += `### ${m.metric}\n${m.context}\n`;
        if ("study" in m && m.study) md += `Study: ${m.study}\n`;
        if ("product" in m && m.product) md += `Product: ${m.product}\n`;
        md += `\n`;
      }
    }

    return { content: [{ type: "text", text: md }] };
  }
);

// ── Tool 5: hannah_get_skills ────────────────────────────────────────────────

server.registerTool(
  "hannah_get_skills",
  {
    title: "Get Hannah's Skills",
    description: `Returns Hannah's complete skill set across product and UX, technical stack, and domain expertise. Also returns her design systems.

Use when someone asks what Hannah knows, her technical abilities, or whether she fits a specific skill requirement.

Examples:
- "What is her technical stack?" / "Does she know prompt engineering?"
- "What are her domain skills?" / "Is she technical enough for this role?"`,
    inputSchema: {
      category: z.enum(["all", "product", "technical", "domain"]).default("all").describe("Filter by category"),
      format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params: { category: string; format: string }) => {
    const { category, format } = params;
    const productSkills = (category === "technical" || category === "domain") ? [] : skills.product;
    const technicalSkills = (category === "product" || category === "domain") ? [] : skills.technical;
    const domainSkills = (category === "product" || category === "technical") ? [] : skills.domain;
    const ds = category === "all" ? designSystems : [];

    const data = { product: productSkills, technical: technicalSkills, domain: domainSkills, designSystems: ds };

    if (format === "json") {
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
    }

    let md = `# Hannah Kraulik Pagade — Skills\n\n`;
    if (productSkills.length > 0) { md += `## Product and UX\n${productSkills.map((s) => `- ${s}`).join("\n")}\n\n`; }
    if (technicalSkills.length > 0) { md += `## Technical Stack\n${technicalSkills.map((s) => `- ${s}`).join("\n")}\n\n`; }
    if (domainSkills.length > 0) { md += `## Domain Expertise\n${domainSkills.map((s) => `- ${s}`).join("\n")}\n\n`; }
    if (ds.length > 0) {
      md += `## Design Systems Built\n`;
      for (const d of ds) { md += `### ${d.name} (${d.product})\nColors: ${d.colors}\nFonts: ${d.fonts}\n\n`; }
    }

    return { content: [{ type: "text", text: md }] };
  }
);

// ── Tool 6: hannah_get_voice ─────────────────────────────────────────────────

server.registerTool(
  "hannah_get_voice",
  {
    title: "Get Hannah's Voice Answers",
    description: `Returns Hannah Kraulik Pagade's answers to common questions in her own warm first-person voice. Use when someone asks how she describes herself, what makes her different, how she works with teams, or what environment she thrives in.

Examples:
- "How does Hannah describe what she does?" / "What makes her different from other PMs?"
- "How does she work with engineering?" / "What kind of company is she looking for?"

Return the voice answer text directly without adding any framing or preamble before it.`,
    inputSchema: {
      question: z
        .enum(["whatIDo", "whatMakesMeDifferent", "howIWorkWithEngineering", "whatBringsBestWork", "all"])
        .default("all")
        .describe("Which voice answer to return. Use 'all' for all four."),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ question }) => {
    const labels: Record<string, string> = {
      whatIDo: "What she does",
      whatMakesMeDifferent: "What makes her different",
      howIWorkWithEngineering: "How she works with engineering",
      whatBringsBestWork: "What brings out her best work",
    };
    if (question === "all") {
      const md = Object.entries(voiceAnswers)
        .map(([k, v]) => `## ${labels[k] ?? k}\n\n${v}`)
        .join("\n\n---\n\n");
      return { content: [{ type: "text", text: md }] };
    }
    const answer = voiceAnswers[question as keyof typeof voiceAnswers];
    return { content: [{ type: "text", text: answer }] };
  }
);

// ── Tool 7: hannah_answer_question ───────────────────────────────────────────

server.registerTool(
  "hannah_answer_question",
  {
    title: "Answer a Common Question About Hannah",
    description: `Returns a warm honest pre-written answer to common recruiter and hiring manager questions about Hannah Kraulik Pagade. Use this before inventing an answer or saying you do not know.

Available topics: availability, compensation, remote, teamManagement, enterpriseExperience, mvpBuilding, discoveryProcess, inheritedProduct, stakeholderConflict, whenProductIsNotWorking, regulatedIndustries, aiSafetyAndEvaluation, thoughtLeadership, startupVsEnterprise, notHealthcareOnly

Return the answer text directly without adding any framing or preamble before it.`,
    inputSchema: {
      topic: z
        .enum([
          "availability", "compensation", "remote", "teamManagement",
          "enterpriseExperience", "mvpBuilding", "discoveryProcess",
          "inheritedProduct", "stakeholderConflict", "whenProductIsNotWorking",
          "regulatedIndustries", "aiSafetyAndEvaluation", "thoughtLeadership",
          "startupVsEnterprise", "notHealthcareOnly",
        ])
        .describe("The topic of the question"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ topic }) => {
    const answer = anticipatedQuestions[topic];
    if (!answer) {
      return { isError: true, content: [{ type: "text", text: `No answer found for topic '${topic}'.` }] };
    }
    return { content: [{ type: "text", text: answer }] };
  }
);

// ── Tool 8: hannah_get_hiring_brief ──────────────────────────────────────────

server.registerTool(
  "hannah_get_hiring_brief",
  {
    title: "Get Hannah's Hiring Brief",
    description: `Returns a recruiter-optimized one-page hiring brief for Hannah Kraulik Pagade with role-specific fit, strongest proof points, links, and interview angles.

Use this as the first tool when screening Hannah for a specific role focus.

Focus options support recruiter shorthand and conversational AI aliases:
- founding-pm, head-of-product, ai-pm, ux-ai, healthcare-ai, general-ai
- conversational-ai-pm, conversational-ai-ux-design, general-ai-product`,
    inputSchema: {
      focus: z
        .enum([
          "founding-pm",
          "head-of-product",
          "ai-pm",
          "ux-ai",
          "healthcare-ai",
          "general-ai",
          "conversational-ai-pm",
          "conversational-ai-ux-design",
          "general-ai-product",
        ])
        .default("general-ai")
        .describe("Role focus lens for the hiring brief."),
      format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ focus, format }) => {
    const normalizedFocus = normalizeRoleFocus(focus);

    const roleFitByFocus: Record<string, string[]> = {
      "founding-pm": [
        "Demonstrated 0-to-1 execution and shipping velocity across multiple live products.",
        "Hands-on product, UX, and implementation depth with founder-level ownership.",
        "Comfort operating in ambiguity with fast prioritization and clear scope control.",
      ],
      "head-of-product": [
        "Strong mix of strategy and execution with measurable outcomes across operations and product.",
        "Cross-functional leadership depth with high-stakes decision making and stakeholder alignment.",
        "Builds trust architectures, delivery systems, and product quality standards teams can scale.",
      ],
      "ai-pm": [
        "Shipped AI-first products with clear safety, evaluation, and trust constraints.",
        "Translates user need into product behavior, prioritization, and measurable outcomes.",
        "Understands model behavior, prompt architecture, and real-world deployment trade-offs.",
      ],
      "ux-ai": [
        "Deep conversation design practice across IVR, chatbot, and agent-assist contexts.",
        "Designs for trust, escalation, and failure handling, not just happy paths.",
        "Combines UX research methods with implementation realism for production-ready AI flows.",
      ],
      "healthcare-ai": [
        "17-year clinical operations background plus shipped healthcare AI products.",
        "Strong safety and escalation mindset for high-risk, regulated environments.",
        "Balances product usability with clinical reliability and compliance expectations.",
      ],
      "general-ai": [
        "Broad AI product leadership across healthcare, fintech, enterprise, and workforce technology.",
        "Can lead strategy and execution from concept through launch and iteration.",
        "Grounded in measurable impact, not speculative claims.",
      ],
    };

    const liveProjects = projects.filter((p) => p.status === "live");
    const topLiveLinks = liveProjects.slice(0, 3).map((p) => ({ name: p.name, url: p.liveUrl, summary: p.summary }));
    const topProofPoints = [
      metrics.operations[0]?.metric,
      metrics.product[2]?.metric,
      metrics.product[3]?.metric,
    ].filter(Boolean) as string[];

    const interviewTopics = [
      "How Hannah designs escalation logic, safety boundaries, and refusal behavior in conversational AI.",
      "How she prioritizes what ships in the first version versus later iterations.",
      "How she aligns design, engineering, and product decisions without relying on formal authority.",
      "How she validates quality with structured research and real-world evaluation loops.",
      "How she handles regulated-domain trade-offs between speed, trust, and compliance.",
    ];

    const hardQuestionsIWelcome = [
      "Tell me where one of your product bets was wrong and what you changed quickly.",
      "How do you decide what not to ship in a 0-to-1 build with stakeholder pressure?",
      "How do you evaluate conversational AI quality beyond happy-path demos?",
      "Where do you draw the line between speed and safety in high-stakes AI contexts?",
      "How would you structure your first 90 days in this exact role and why?",
    ];

    const founderRisksAndMitigations = [
      {
        risk: "Concern that healthcare depth may narrow cross-domain product range.",
        mitigation:
          "Portfolio evidence spans healthcare, fintech, enterprise conversational AI, workforce technology, and consumer products with live outputs.",
      },
      {
        risk: "Concern about balancing strategy with execution in early-stage environments.",
        mitigation:
          "Demonstrated founder-style ownership from concept through shipping, including scoping, UX, prompt architecture, and production delivery.",
      },
      {
        risk: "Concern about AI trust/safety maturity under release pressure.",
        mitigation:
          "Explicit guardrails, escalation logic, validation patterns, and failure-mode thinking are built into shipped conversational systems.",
      },
    ];

    const scorecardByFocus: Record<CanonicalRoleFocus, { speed_to_value: number; execution_depth: number; cross_functional_leadership: number; ai_safety_maturity: number }> =
      {
        "founding-pm": { speed_to_value: 5, execution_depth: 5, cross_functional_leadership: 5, ai_safety_maturity: 4 },
        "head-of-product": { speed_to_value: 4, execution_depth: 5, cross_functional_leadership: 5, ai_safety_maturity: 4 },
        "ai-pm": { speed_to_value: 4, execution_depth: 4, cross_functional_leadership: 4, ai_safety_maturity: 5 },
        "ux-ai": { speed_to_value: 4, execution_depth: 4, cross_functional_leadership: 4, ai_safety_maturity: 5 },
        "healthcare-ai": { speed_to_value: 4, execution_depth: 4, cross_functional_leadership: 4, ai_safety_maturity: 5 },
        "general-ai": { speed_to_value: 4, execution_depth: 4, cross_functional_leadership: 4, ai_safety_maturity: 4 },
      };

    const first30_60_90ByFocus: Record<CanonicalRoleFocus, { day30: string[]; day60: string[]; day90: string[] }> = {
      "founding-pm": {
        day30: [
          "Map founder goals, user pain, and technical constraints into a single decision framework.",
          "Define first-release success metrics and failure boundaries for conversational behavior.",
          "Prioritize the smallest lovable flow with explicit non-goals to preserve velocity.",
        ],
        day60: [
          "Ship and instrument the first production conversation loop with quality checkpoints.",
          "Run structured user feedback and failure analysis, then tighten prompts and UX flow.",
          "Stand up a weekly product-engineering-quality operating rhythm.",
        ],
        day90: [
          "Demonstrate measurable improvement in conversion, completion, or turn-efficiency goals.",
          "Publish v2 roadmap tied to validated learnings and unit economics.",
          "Institutionalize release criteria for speed + trust so scaling does not erode quality.",
        ],
      },
      "head-of-product": {
        day30: [
          "Audit current strategy, roadmap quality, and cross-functional operating gaps.",
          "Align leadership on a focused product thesis and measurable quarterly outcomes.",
          "Define portfolio priorities and decision rights across product/design/engineering.",
        ],
        day60: [
          "Stabilize planning cadence, scorecards, and execution accountability mechanisms.",
          "Reframe roadmap to highlight highest-leverage bets and remove low-signal work.",
          "Establish product quality and trust standards for AI feature delivery.",
        ],
        day90: [
          "Show progress against agreed business and product KPI targets.",
          "Operationalize hiring/growth plan for product function maturity.",
          "Deliver a durable product operating model that scales with team growth.",
        ],
      },
      "ai-pm": {
        day30: [
          "Clarify target user outcomes and evaluation rubric for AI behavior quality.",
          "Identify top model and UX failure modes for immediate mitigation.",
          "Prioritize highest-value use cases with clear launch guardrails.",
        ],
        day60: [
          "Ship initial AI workflow improvements with instrumentation and review loops.",
          "Improve prompt, policy, and escalation behavior from real user interactions.",
          "Align stakeholders on trade-offs between latency, quality, and safety.",
        ],
        day90: [
          "Demonstrate outcome lift tied to usage, completion, and trust metrics.",
          "Codify repeatable AI release process with evaluation checkpoints.",
          "Publish next-phase roadmap grounded in observed product behavior.",
        ],
      },
      "ux-ai": {
        day30: [
          "Map conversational journeys, user intents, and trust breakpoints.",
          "Define conversation quality standards across tone, clarity, and escalation behavior.",
          "Prioritize critical UX improvements that remove friction quickly.",
        ],
        day60: [
          "Deliver updated dialogue flows and edge-case handling patterns.",
          "Run usability and comprehension testing with structured scoring.",
          "Align design decisions with implementation constraints and model behavior realities.",
        ],
        day90: [
          "Show measurable gains in flow completion, user confidence, and handoff quality.",
          "Package reusable conversation design patterns for team-wide use.",
          "Set next-quarter UX roadmap tied to observed behavioral outcomes.",
        ],
      },
      "healthcare-ai": {
        day30: [
          "Map clinical-risk pathways and define escalation boundaries.",
          "Align product and compliance expectations around safe interaction patterns.",
          "Prioritize highest-impact use cases with measurable safety criteria.",
        ],
        day60: [
          "Ship guarded conversational flows with validation and refusal protocols.",
          "Run scenario-based checks across high-acuity and ambiguity-heavy cases.",
          "Tighten communication clarity for patient and clinician-facing interactions.",
        ],
        day90: [
          "Demonstrate improved safety adherence and interaction completeness.",
          "Operationalize healthcare AI quality review cadence with cross-functional stakeholders.",
          "Publish risk-informed roadmap for broader deployment.",
        ],
      },
      "general-ai": {
        day30: [
          "Establish top AI opportunities and success metrics by user segment.",
          "Audit delivery constraints and trust risks across current roadmap.",
          "Define near-term priorities with explicit value and feasibility scoring.",
        ],
        day60: [
          "Ship highest-value improvements and validate with real usage signals.",
          "Tighten collaboration patterns across design, engineering, and product.",
          "Document repeatable process for evaluating and shipping AI changes.",
        ],
        day90: [
          "Show measurable business and product KPI movement.",
          "Deliver next-phase roadmap prioritized by evidence over intuition.",
          "Institutionalize quality standards for scalable AI product execution.",
        ],
      },
    };

    const whyNowTransitionByFocus: Record<CanonicalRoleFocus, string> = {
      "founding-pm":
        "Now is the right moment because this role needs founder-level ownership, not siloed PM coordination. Hannah's recent shipped AI portfolio and prior high-stakes leadership make her immediately effective in a 0-to-1 environment.",
      "head-of-product":
        "Now is the right moment because this role needs strategy plus execution credibility at once. Hannah brings operating rigor, AI product depth, and the ability to align cross-functional teams quickly.",
      "ai-pm":
        "Now is the right moment because this role requires practical AI product judgment grounded in shipped work. Hannah combines delivery speed with evaluation, trust, and user-outcome discipline.",
      "ux-ai":
        "Now is the right moment because this role requires conversational UX depth tied to production constraints. Hannah has repeatedly designed and shipped trust-aware AI interaction systems.",
      "healthcare-ai":
        "Now is the right moment because this role needs domain fluency plus AI execution. Hannah bridges clinical risk understanding with modern conversational AI product delivery.",
      "general-ai":
        "Now is the right moment because this role benefits from a builder who can move across strategy, UX, and implementation while keeping outcomes measurable and trust-centered.",
    };

    const data = {
      candidateSnapshot:
        "AI product leader across product management and UX design with 17 years of high-stakes operating experience and multiple live AI products. Strong in strategy and execution, with depth in conversational AI behavior, trust design, and shipping velocity.",
      whyNowTransition: whyNowTransitionByFocus[normalizedFocus],
      focusRequested: focus,
      focusApplied: normalizedFocus,
      roleLens: canonicalRoleLabels[normalizedFocus],
      primaryTargetRoles: ["Conversational AI Product Manager", "Conversational AI UX Designer"],
      secondaryTargetRoles: ["AI Product Manager (broader)", "Head of Product (early-stage AI products)"],
      idealEnvironment: "0-to-1 or scaling AI teams where product, design, engineering, and applied AI collaborate tightly.",
      whyConversationalAISpecific: [
        "Conversation design depth across triage, enterprise routing, and multi-channel interaction models.",
        "Trust and safety systems include escalation logic, urgency classification, guardrails, and validation patterns.",
        "Shipped measurable conversational outcomes, including turn reduction and production deployment under real constraints.",
      ],
      roleSpecificStrengths: roleFitByFocus[normalizedFocus] ?? roleFitByFocus["general-ai"],
      topProofPoints,
      availability: profile.availability,
      location: profile.location,
      relocation: {
        openToRelocation: profile.openToRelocation,
        preferredLocations: profile.preferredLocations,
      },
      liveLinks: topLiveLinks,
      suggestedInterviewTopics: interviewTopics,
      hardQuestionsIWelcome,
      founderRisksAndMitigations,
      roleScorecard: scorecardByFocus[normalizedFocus],
      first30_60_90: first30_60_90ByFocus[normalizedFocus],
      freshness: {
        profileDataLastUpdated: freshness.profileDataLastUpdated,
        mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
      },
      anonymizationNotice,
      nextStepCTA:
        "Best next step: email hannah.pagade@gmail.com with the role title and job description for a tailored resume and conversation packet, or connect on LinkedIn at https://www.linkedin.com/in/hannah-pagade.",
    };

    if (format === "json") {
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
    }

    if ((format as string) === "summary") {
      const summary = `# Hiring Summary — ${profile.name}

- Focus requested: ${focus}
- Focus applied: ${data.roleLens}
- Top proof points: ${data.topProofPoints.join(" | ")}
- Availability: ${data.availability}
- Location: ${data.location} (Relocation: ${data.relocation.openToRelocation ? "Yes" : "No"})
- Why now: ${data.whyNowTransition}
- Next step: ${data.nextStepCTA}`;
      return { content: [{ type: "text", text: summary }], structuredContent: data };
    }

    const md = `# Hiring Brief — ${profile.name}

## Candidate Snapshot
${data.candidateSnapshot}

## Why Now
${data.whyNowTransition}

## Role Focus
Requested: ${focus}
Applied lens: ${data.roleLens}

## Primary Target Roles
${data.primaryTargetRoles.map((r) => `- ${r}`).join("\n")}

## Secondary Target Roles
${data.secondaryTargetRoles.map((r) => `- ${r}`).join("\n")}

## Ideal Environment
${data.idealEnvironment}

## Why This Candidate for Conversational AI Specifically
${data.whyConversationalAISpecific.map((x) => `- ${x}`).join("\n")}

## Role-Specific Strengths
${data.roleSpecificStrengths.map((x) => `- ${x}`).join("\n")}

## Top Proof Points
${data.topProofPoints.map((x) => `- ${x}`).join("\n")}

## Availability and Location
- Availability: ${data.availability}
- Location: ${data.location}
- Open to relocation: ${data.relocation.openToRelocation ? "Yes" : "No"}
- Preferred locations: ${data.relocation.preferredLocations.join(", ")}

## Live Links
${data.liveLinks.map((x) => `- ${x.name}: ${x.url}`).join("\n")}

## Suggested Interview Topics
${data.suggestedInterviewTopics.map((x) => `- ${x}`).join("\n")}

## Hard Questions I Welcome
${data.hardQuestionsIWelcome.map((x) => `- ${x}`).join("\n")}

## Founder Risks and Mitigations
${data.founderRisksAndMitigations.map((x) => `- Risk: ${x.risk}\n  Mitigation: ${x.mitigation}`).join("\n")}

## Role Scorecard (1-5)
- Speed to value: ${data.roleScorecard.speed_to_value}
- Execution depth: ${data.roleScorecard.execution_depth}
- Cross-functional leadership: ${data.roleScorecard.cross_functional_leadership}
- AI safety maturity: ${data.roleScorecard.ai_safety_maturity}

## First 30/60/90
### Day 30
${data.first30_60_90.day30.map((x) => `- ${x}`).join("\n")}
### Day 60
${data.first30_60_90.day60.map((x) => `- ${x}`).join("\n")}
### Day 90
${data.first30_60_90.day90.map((x) => `- ${x}`).join("\n")}

## Notes
- ${data.anonymizationNotice}
- Profile data last updated: ${data.freshness.profileDataLastUpdated}
- MCP content set last updated: ${data.freshness.mcpContentSetLastUpdated}

## Recommended Next Step
${data.nextStepCTA}`;

    return { content: [{ type: "text", text: md }], structuredContent: data };
  }
);

// ── Tool 9: hannah_generate_resume ───────────────────────────────────────────

server.registerTool(
  "hannah_generate_resume",
  {
    title: "Generate a Tailored Resume for Hannah",
    description: `Generates a tailored resume for Hannah Kraulik Pagade based on a specific job description. Uses only verified profile data. No fabricated metrics or invented employers. Claude rewrites and optimizes language only.

Use when a recruiter wants Hannah's resume tailored to their specific role.

Examples:
- "Generate Hannah's resume for our Head of Product role"
- "Show me her resume for a Founding PM at a fintech startup"

When this tool returns output, display the full resume text directly to the user without any narration, summary, or commentary before or after the resume content.

Provenance: Generated from verified profile and project data in this MCP. No fabricated employers, metrics, dates, or accomplishments are permitted.`,
    inputSchema: {
      jobTitle: z.string().min(2).max(100).describe("The role title"),
      company: z.string().min(1).max(100).describe("The company name"),
      jobDescription: z.string().min(50).max(4000).describe("The job description to tailor toward"),
      roleType: z
        .enum([
          "founding-pm",
          "head-of-product",
          "ai-pm",
          "ux-ai",
          "healthcare-ai",
          "general-ai",
          "conversational-ai-pm",
          "conversational-ai-ux-design",
          "general-ai-product",
          "pm",
          "ux-design",
          "conversational-ai",
          "general",
        ])
        .default("general-ai")
        .describe("Role type to optimize framing for"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async ({ jobTitle, company, jobDescription, roleType }) => {
    const normalizedRoleType = normalizeRoleFocus(roleType);
    const roleLensLabel = canonicalRoleLabels[normalizedRoleType];
    const systemLines = [
      "You are generating a tailored resume for Hannah Kraulik Pagade. Use ONLY the verified data provided. Do not invent metrics, employers, dates, or accomplishments not listed here. Your job is to rewrite and optimize language and ordering only.",
      "",
      "POSITIONING: " + profile.positioning,
      "ROLE LENS: " + roleLensLabel,
      "YEARS: " + profile.background.yearsExperience + " years (2009 to present)",
      "BACKGROUND: " + profile.background.summary,
      "LEADERSHIP: " + profile.background.leadershipDepth,
      "EDUCATION: " + profile.education.degree + " at " + profile.education.school + ", " + profile.education.status + ", expected " + profile.education.expected,
      "CERTIFICATIONS: " + profile.certifications.join(", "),
      "CURRENT ROLE: " + profile.currentRole,
      "LOCATION: " + profile.location + " — open to relocation including San Francisco, open to remote",
      "",
      "VERIFIED OPERATIONS METRICS:",
      ...metrics.operations.map((m) => "- " + m.metric + " | " + m.context + " | " + ("employer" in m ? m.employer : "") + " | " + ("role" in m ? m.role : "") + " | " + ("dates" in m ? m.dates : "")),
      "",
      "VERIFIED PRODUCT METRICS:",
      ...metrics.product.map((m) => "- " + m.metric + " | " + m.context),
      "",
      "LIVE PRODUCTS:",
      ...projects.filter((p) => p.status === "live").map((p) => "- " + p.name + " (" + p.domain + ") at " + p.liveUrl + ": " + p.summary),
      "",
      "IN DEVELOPMENT:",
      ...projects.filter((p) => p.status === "building").map((p) => "- " + p.name + " (" + p.domain + "): " + p.summary),
      "",
      "TECHNICAL SKILLS: " + skills.technical.join(", "),
      "PRODUCT SKILLS: " + skills.product.slice(0, 15).join(", "),
      "DOMAIN EXPERTISE: " + skills.domain.join(", "),
      "",
      "RULES: Never use em dashes. Never call Hannah an executive. Never mention Pagade Ventures, EclipseLink AI, or moonlstudios.com. Always say 17 years, never 15. Use only the metrics and employers listed above.",
      "",
      "OUTPUT CONTRACT (non-negotiable): Your entire response must be only the resume text, ready to paste into a document.",
      "Do not include any preamble or postscript: no 'Here is', no 'Below is', no commentary on how the resume was tailored, no callouts, no meta bullet lists, no 'things to update', no questions, and no offer to write a cover letter.",
      "Your first character must be the first character of the resume (for example the candidate name or the first section heading). Your last character must be the last character of the resume.",
    ];

    const userPrompt =
      "Generate a tailored resume for Hannah for: " +
      jobTitle +
      " at " +
      company +
      ". Role type: " +
      roleType +
      " (normalized role lens: " +
      roleLensLabel +
      ")" +
      ".\n\nJob Description:\n" +
      jobDescription +
      "\n\nFormat: Summary, Skills, Experience, Projects, Education. Write the summary in first person, warm and direct. Keep bullet points concise and impact-focused. End with: 'Full downloadable PDF available at hannahkraulikpagade.com/resume-builder'" +
      "\n\nReply with the resume only — no other words before or after it.";

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemLines.join("\n"),
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = extractAnthropicText(response.content);
      if (!text) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: "[ERR_RESUME_EMPTY] Resume generation returned empty output. Check ANTHROPIC_API_KEY and retry with a shorter, cleaner job description (3-6 key requirements).",
          }],
        };
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: {
          document: "resume",
          text,
          provenance: documentProvenanceStatement,
          profileDataLastUpdated: freshness.profileDataLastUpdated,
          mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
        },
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: buildGenerationError("resume", err) }],
      };
    }
  }
);

// ── Tool 10: hannah_generate_cover_letter ────────────────────────────────────

server.registerTool(
  "hannah_generate_cover_letter",
  {
    title: "Generate a Tailored Cover Letter for Hannah",
    description: `Generates a tailored cover letter for Hannah Kraulik Pagade for a specific role and company. Written in Hannah's warm direct first-person voice. Uses only verified profile data.

Examples:
- "Write Hannah's cover letter for your Head of Product opening"
- "Generate a cover letter for a Founding PM role at a healthtech startup"

When this tool returns output, display the full cover letter text directly to the user without any narration, summary, or commentary before or after the letter content.

Provenance: Generated from verified profile and project data in this MCP. No fabricated employers, metrics, dates, or accomplishments are permitted.`,
    inputSchema: {
      jobTitle: z.string().min(2).max(100).describe("The role title"),
      company: z.string().min(1).max(100).describe("The company name"),
      jobDescription: z.string().min(50).max(4000).describe("The job description"),
      hiringManagerName: z.string().optional().describe("Hiring manager name if known"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async ({ jobTitle, company, jobDescription, hiringManagerName }) => {
    const systemLines = [
      "You are generating a cover letter for Hannah Kraulik Pagade. Write in her warm direct first-person voice. Use ONLY the verified data provided.",
      "",
      "VOICE REFERENCE (this is how Hannah sounds):",
      voiceAnswers.whatMakesMeDifferent,
      "",
      "POSITIONING: " + profile.positioning,
      "YEARS: " + profile.background.yearsExperience + " years (2009 to present)",
      "BACKGROUND: " + profile.background.summary,
      "EDUCATION: " + profile.education.degree + " at " + profile.education.school + ", expected " + profile.education.expected,
      "CURRENT ROLE: " + profile.currentRole,
      "",
      "KEY METRICS:",
      ...metrics.operations.slice(0, 3).map((m) => "- " + m.metric + ": " + m.context),
      ...metrics.product.slice(0, 3).map((m) => "- " + m.metric + ": " + m.context),
      "",
      "LIVE PRODUCTS:",
      ...projects.filter((p) => p.status === "live").map((p) => "- " + p.name + " (" + p.domain + ") at " + p.liveUrl),
      "",
      "RULES: Never use em dashes. Never call Hannah an executive. Never mention Pagade Ventures, EclipseLink AI, or moonlstudios.com. Always say 17 years, never 15. Three paragraphs maximum. End with: hannah.pagade@gmail.com or hannahkraulikpagade.com",
      "",
      "OUTPUT CONTRACT (non-negotiable): Your entire response must be only the cover letter text.",
      "Do not include any preamble or postscript: no 'Here is', no commentary on tailoring, no callouts, no questions, and no offer to write a resume.",
      "Your first character must be the salutation (e.g. 'Dear'). Your last line must be the sign-off.",
    ];

    const greeting = hiringManagerName
      ? "Dear " + hiringManagerName + ","
      : "Dear Hiring Team at " + company + ",";

    const userPrompt =
      "Write a three-paragraph cover letter for Hannah applying to " +
      jobTitle +
      " at " +
      company +
      ".\n\nOpening: " +
      greeting +
      "\n\nJob Description:\n" +
      jobDescription +
      "\n\nMake it warm, direct, and specific to this role. First paragraph: who she is and why this role specifically. Second paragraph: the most relevant proof from her background. Third paragraph: what she brings to the team and a clear call to action. Sign off as Hannah Kraulik Pagade." +
      "\n\nReply with the letter only — no other words before or after it.";

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemLines.join("\n"),
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = extractAnthropicText(response.content);
      if (!text) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: "[ERR_COVER_LETTER_EMPTY] Cover letter generation returned empty output. Check ANTHROPIC_API_KEY and retry with a shorter, cleaner job description (3-6 key requirements).",
          }],
        };
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: {
          document: "cover_letter",
          text,
          provenance: documentProvenanceStatement,
          profileDataLastUpdated: freshness.profileDataLastUpdated,
          mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
        },
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: buildGenerationError("cover_letter", err) }],
      };
    }
  }
);

// ── HTTP Server ───────────────────────────────────────────────────────────────

async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      server: "ask-hannah-mcp-server",
      version: serviceVersion,
      buildDate: buildMeta.buildDate,
      gitSha: buildMeta.gitSha,
      tools: [
        "hannah_get_profile",
        "hannah_list_projects",
        "hannah_get_project_detail",
        "hannah_get_metrics",
        "hannah_get_skills",
        "hannah_get_voice",
        "hannah_answer_question",
        "hannah_get_hiring_brief",
        "hannah_generate_resume",
        "hannah_generate_cover_letter",
      ],
    });
  });

  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "Ask Hannah MCP Server",
      description: "Interactive portfolio for Hannah Kraulik Pagade. Add this URL as a custom MCP connector in Claude to query her background, projects, metrics, skills, voice answers, hiring FAQs, and generate tailored resumes and cover letters.",
      connect: `${process.env.BASE_URL ?? "https://your-railway-url.railway.app"}/mcp`,
      portfolio: "https://hannahkraulikpagade.com",
      linkedin: "https://www.linkedin.com/in/hannah-pagade",
      serviceVersion,
      buildDate: buildMeta.buildDate,
      gitSha: buildMeta.gitSha,
      profileDataLastUpdated: freshness.profileDataLastUpdated,
      mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
    });
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT ?? "3000");
  app.listen(port, () => {
    console.error(`Ask Hannah MCP Server running on port ${port}`);
    console.error(`MCP endpoint: http://localhost:${port}/mcp`);
  });
}

runHTTP().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
