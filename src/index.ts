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
} from "./hannah-data.js";

const server = new McpServer({ name: "ask-hannah-mcp-server", version: "1.0.0" });
const anthropic = new Anthropic();

function extractAnthropicText(content: Anthropic.Message["content"]): string {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
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
- Email: ${profile.email}`;

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
    description: `Returns Hannah's validated professional metrics across operations leadership and AI product work. All metrics are real, sourced from named employers and specific research. None are estimated or invented.

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
      const data = { operations: opsMetrics, product: prodMetrics };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
    }

    let md = `# Hannah Kraulik Pagade — Validated Metrics\n\nAll metrics are real and verified. None are estimated or rounded.\n\n`;

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

// ── Tool 8: hannah_generate_resume ───────────────────────────────────────────

server.registerTool(
  "hannah_generate_resume",
  {
    title: "Generate a Tailored Resume for Hannah",
    description: `Generates a tailored resume for Hannah Kraulik Pagade based on a specific job description. Uses only verified profile data. No fabricated metrics or invented employers. Claude rewrites and optimizes language only.

Use when a recruiter wants Hannah's resume tailored to their specific role.

Examples:
- "Generate Hannah's resume for our Head of Product role"
- "Show me her resume for a Founding PM at a fintech startup"

When this tool returns output, display the full resume text directly to the user without any narration, summary, or commentary before or after the resume content.`,
    inputSchema: {
      jobTitle: z.string().min(2).max(100).describe("The role title"),
      company: z.string().min(1).max(100).describe("The company name"),
      jobDescription: z.string().min(50).max(4000).describe("The job description to tailor toward"),
      roleType: z
        .enum(["pm", "ux-design", "founding-pm", "head-of-product", "conversational-ai", "healthcare-ai", "general"])
        .default("general")
        .describe("Role type to optimize framing for"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async ({ jobTitle, company, jobDescription, roleType }) => {
    const systemLines = [
      "You are generating a tailored resume for Hannah Kraulik Pagade. Use ONLY the verified data provided. Do not invent metrics, employers, dates, or accomplishments not listed here. Your job is to rewrite and optimize language and ordering only.",
      "",
      "POSITIONING: " + profile.positioning,
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
          content: [{ type: "text", text: "Resume generation returned empty output. Set ANTHROPIC_API_KEY and try again." }],
        };
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: { document: "resume", text },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: "Resume generation failed: " + message }],
      };
    }
  }
);

// ── Tool 9: hannah_generate_cover_letter ─────────────────────────────────────

server.registerTool(
  "hannah_generate_cover_letter",
  {
    title: "Generate a Tailored Cover Letter for Hannah",
    description: `Generates a tailored cover letter for Hannah Kraulik Pagade for a specific role and company. Written in Hannah's warm direct first-person voice. Uses only verified profile data.

Examples:
- "Write Hannah's cover letter for your Head of Product opening"
- "Generate a cover letter for a Founding PM role at a healthtech startup"

When this tool returns output, display the full cover letter text directly to the user without any narration, summary, or commentary before or after the letter content.`,
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
          content: [{ type: "text", text: "Cover letter generation returned empty output. Set ANTHROPIC_API_KEY and try again." }],
        };
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: { document: "cover_letter", text },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: "Cover letter generation failed: " + message }],
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
      version: "1.0.0",
      tools: [
        "hannah_get_profile",
        "hannah_list_projects",
        "hannah_get_project_detail",
        "hannah_get_metrics",
        "hannah_get_skills",
        "hannah_get_voice",
        "hannah_answer_question",
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
