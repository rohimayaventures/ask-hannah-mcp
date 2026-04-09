# Ask Hannah MCP - Portfolio Case Study

**Hannah Kraulik Pagade | Rohimaya Health AI**
[hannahkraulikpagade.com](https://hannahkraulikpagade.com)

**Last updated:** April 2026

---

## Project metadata

| Field | Value |
|-------|-------|
| **Project name** | Ask Hannah MCP |
| **Tagline** | A live MCP server that lets AI systems query Hannah's professional data directly. |
| **Status** | Live - production |
| **Primary URL** | https://ask-hannah-mcp-production.up.railway.app/mcp |
| **Repo** | github.com/rohimayaventures/ask-hannah-mcp |
| **Tags** | MCP · AGENTIC-AI · INFRASTRUCTURE · DEVELOPER-TOOLING |
| **Role** | Product Lead, API Designer, Full-Stack Implementation |
| **Timeline** | April 2026 |
| **Stack** | Node.js · TypeScript · MCP SDK (@modelcontextprotocol/sdk) · Express · Zod · Railway |

---

## Section 1 - The proof point

Ask Hannah MCP is registered as a live connector in Claude.ai.

Any hiring manager, recruiter, or peer who connects it can open a new Claude chat and type: "Use the Ask Hannah MCP to tell me what makes Hannah different from other PMs." Claude calls the tool, gets structured data from the server, and synthesizes a response grounded in real facts from a source Hannah controls.

This is not a portfolio website with a nav bar. It is a queryable data layer that integrates into the tools hiring managers already use. The product demonstrates, in the act of being used, exactly what it claims about the builder: she understands how AI systems connect to each other, how to design tools that downstream agents can call reliably, and what it means to build for agentic workflows instead of just chat interfaces.

The proof point is structural. The medium is the message.

---

## Section 2 - The problem

### The personal professional observation

Every portfolio in the AI PM space is a static website. A recruiter arrives, clicks through case studies, decides in thirty seconds whether to keep reading. The signal is buried under design. The format has not changed since 2010.

Meanwhile, the tools recruiters and hiring managers actually use are changing fast. AI assistants are now embedded in hiring workflows. The question is not whether AI will touch the screening process. It already has. The question is whether your portfolio data is structured in a way those systems can actually consume.

A PDF resume is not structured data. A personal website is not structured data. A well-designed MCP server is.

### The structural gap

The standard portfolio fails in three ways for the kind of roles Hannah is targeting:

First, it is not queryable. A recruiter cannot ask "does she have experience with structured output contracts in production?" and get a sourced, accurate answer. They have to read and infer.

Second, it is not composable. A hiring manager cannot drop it into their AI-assisted workflow and have it synthesize with the job description, the candidate's LinkedIn, and their team's criteria. It is a separate artifact they have to mentally translate.

Third, it decays. Static pages go stale. An MCP server is a live endpoint. When the data changes, every downstream query reflects the change automatically.

### Why this matters for the target audience

Head of Product and AI PM roles at AI-native companies require proof of product instinct around agentic systems, not just chat. Shipping a live MCP server that does something real, and doing it before most candidates even understand what MCP is, demonstrates the instinct before the interview starts.

---

## Section 3 - The process

### The constraint set

**Constraint 1: No hallucination on professional claims.**
Any tool that generates resume or cover letter content must operate only from structured data in `hannah-data.ts`. The model cannot invent metrics, employers, or credentials. This required a strict output contract enforced in the system prompt and user prompt, with standardized error codes and empty-output handling when generation fails.

**Constraint 2: Voice consistency across all tools.**
The `hannah_get_voice` tool returns first-person statements written in Hannah's voice, not summaries about her. The distinction matters because downstream AI systems that call this tool will synthesize its output for a human audience. If the voice data is third-person and formal, the synthesized response sounds like a press release. The tool returns statements like "I did not come to AI from a whiteboard. I came from the floor." That voice carries through.

**Constraint 3: MCP transport must match Claude.ai connector requirements.**
Claude.ai expects a public HTTP MCP endpoint. The initial build used stdio transport, which works for local tool use but not for a publicly registered connector. This required a full transport layer swap from stdio to HTTP using Express and the SDK's streamable HTTP transport before the server could be registered.

**Constraint 4: Railway deployment with no persistent state.**
The server is stateless by design. All professional data lives in `hannah-data.ts` at compile time. There is no database, no session management, and no runtime data fetching. This was a deliberate decision to keep the server fast, cheap to run, and failure-resistant. A Railway restart or redeploy picks up exactly where it left off.

### Core architecture decisions

**`hannah-data.ts` as the single source of truth for content.**
All ten tools read professional content from one typed TypeScript module. Profile data, voice answers, project details, metrics, skills, and FAQ answers live there. When a fact changes, it changes once and propagates to every tool automatically. Handler logic and shared helpers now live in `src/lib` and `src/tool-handlers` for maintainability, but the facts still originate in one place. This is the same discipline applied to `caseStudies.ts` on the portfolio site: one source of truth, multiple rendering surfaces.

**Tool schema design for downstream synthesis.**
MCP tools are only as useful as the structure they return. Each tool was designed with the downstream synthesis step in mind. `hannah_get_profile` returns a flat object with clearly labeled fields because Claude's synthesis layer handles prose. `hannah_generate_resume` returns document text because the downstream use case is direct output to a human, not further AI processing.

**`hannah_get_voice` as a distinct tool from `hannah_get_profile`.**
This was a deliberate separation. Profile data is factual: years of experience, job titles, product URLs. Voice data is positional: how Hannah frames her own story, in her own words, for a human audience. Mixing the two would force every tool caller to filter the signal they want. Separating them means the caller gets exactly what they asked for.

**`hannah_get_hiring_brief` as the recruiter-first surface.**
Screening happens fast. This tool returns a one-shot hiring brief with role focus, proof points, interview angles, optional summary mode, and explicit next-step contact ordering so the host model does not bury the CTA.

### Pivot stories

**Pivot 1: The stdio to HTTP MCP transport swap.**

The first working build used stdio transport because that is the simplest MCP pattern and most documentation assumes a local use case. It compiled, passed all local tests, and produced correct tool outputs.

Then it failed to register as a Claude.ai connector.

Claude.ai expects a public HTTP MCP endpoint. Stdio does not expose a URL. The entire transport layer had to be rebuilt around Express and the streamable HTTP transport adapter before the server could go public.

The lesson: when building for an external platform's integration spec, read the integration spec first, not the SDK quickstart. They are not the same document.

**Pivot 2: The resume tool output contract.**

The first version of `hannah_generate_resume` called the Claude API with a loosely structured prompt and let the model decide how to format the output. The outputs were good but inconsistent. Section ordering varied. Some runs included a summary section; others did not. Metric phrasing drifted between runs.

The fix was to enforce a strict output contract in the prompts: the model may only return the document body, with no preamble or commentary, and only verified metrics and employers from the provided data. Empty responses and API failures map to explicit error codes with retry guidance.

The lesson: generation tools in production need a contract, not a suggestion. The model does what the prompt allows. If the prompt allows variation, you get variation.

**Pivot 3: Scoping what the server should not do.**

Early in the design phase, there was a discussion about whether to make the server queryable against job descriptions, scoring Hannah's fit for a given role in real time. It would have been technically interesting.

It was cut.

The reason: a fit-scoring tool that can return a low fit score is a liability in a job search context. The server's job is to represent Hannah accurately and compellingly, not to act as an evaluator against criteria it does not control. The generation tools (resume, cover letter) already handle the tailoring use case more usefully and with better UX for the person on the other end.

The lesson: scope is a product decision. Not every technically interesting feature belongs in the product.

**Pivot 4: From credible outputs to a clear next action.**

Once trust and structure were solid, the bottleneck became conversion. Recruiters needed an obvious path after reading the brief. The hiring brief gained a compact summary mode with a decision recommendation line, role-specific CTA wording, and an explicit contact fallback order: Calendly first, then LinkedIn, then email. Outbound contact links also gained consistent UTM source tagging so traffic from the MCP is attributable.

The lesson: a portfolio MCP is still a product surface. If the next step is fuzzy, the artifact does not ship its full value.

---

## Section 4 - What shipped

### Tools (10 live)

| Tool | What it returns |
|------|----------------|
| `hannah_get_profile` | Full professional profile: current role, background, education, target roles, location, contact links |
| `hannah_list_projects` | All live and in-progress projects with status, taglines, URLs, and one-line summaries. Filterable by status. |
| `hannah_get_project_detail` | Deep dive on any specific project: problem, key decisions with reasoning, full stack, design system, proof points |
| `hannah_get_metrics` | Verified professional metrics for operations and product work. JSON mode adds `evidenceTag` and `confidenceNote` for trust framing. Category filters return the matching slice of the dataset. |
| `hannah_get_skills` | Full technical and domain skill set organized by category |
| `hannah_get_voice` | First-person positioning statements in Hannah's voice, organized by question type |
| `hannah_answer_question` | Pre-written answers to common recruiter and hiring-manager topics from structured FAQ data, selected by topic enum |
| `hannah_get_hiring_brief` | Recruiter-optimized brief: role focus, proof points, interview prompts, optional summary mode, score rationale, proof-source pointers, 90-day KPI targets, decision recommendation, explicit contact fallback order |
| `hannah_generate_resume` | Tailored resume text generated from structured data only, scoped to a role type and job description |
| `hannah_generate_cover_letter` | Tailored cover letter, same data contract as resume generation |

### Infrastructure

- Live HTTP endpoint with streamable MCP transport (Express), compatible with Claude.ai connector architecture
- Zod input validation on all tool inputs
- Health check at `/health` returning server status, version metadata, and tool manifest; root `/` exposes freshness and contact health diagnostics
- Railway deployment with auto-redeploy on push to main
- Stateless architecture: zero database, zero session state, full reset on redeploy
- Automated tests for role normalization, contact URL handling, and metric tagging (`npm test`); sample JSON shapes documented in-repo for regression clarity

---

## Section 5 - Technical architecture

| Layer | Technology | Decision rationale |
|-------|-----------|-------------------|
| Runtime | Node.js 20 | MCP SDK requires Node; no reason to add complexity with Bun or Deno at this scale |
| Language | TypeScript | Type safety on tool schemas and data contracts; same language as portfolio site for maintainability |
| MCP transport | HTTP streamable (Express) | Required for Claude.ai connector compatibility; stdio works locally but cannot be registered as a public connector |
| Data layer | `hannah-data.ts` (compile-time) | Stateless by design; no database needed for read-only professional data |
| Code organization | `src/lib`, `src/tool-handlers` | Shared helpers and tool handlers separated from the server entrypoint for safer iteration |
| Input validation | Zod | Schema enforcement on all tool inputs before handler execution |
| AI generation | Anthropic Claude API (Sonnet) | Resume and cover letter generation; strict output contract via prompts; standardized errors on failure |
| Deployment | Railway | Auto-deploy on push; free tier sufficient for a low-traffic professional tool; public URL with HTTPS |
| MCP framework | @modelcontextprotocol/sdk | Official SDK; most compatible with evolving Claude.ai connector spec |

---

## Section 6 - Status matrix

| Area | Status | Notes |
|------|--------|-------|
| All 10 tools responding | Working | Verified via `/health` endpoint and live Claude.ai connector testing |
| HTTP streamable MCP transport | Working | Registered and confirmed in Claude.ai connectors |
| Railway deployment | Working | Auto-deploys on push to main; Online status confirmed |
| Resume generation | Working | Strict output contract enforced; tested across multiple role focuses |
| Cover letter generation | Working | Same contract as resume; tested |
| Hiring brief (including summary mode) | Working | Role focus, proof pointers, decision line, contact fallback order |
| Voice tool first-person consistency | Working | Verified in live connector testing |
| Metrics trust metadata | Working | JSON includes `evidenceTag` and `confidenceNote` |
| Contact conversion ordering | Working | Calendly, then LinkedIn, then email, surfaced in hiring outputs |
| Modular codebase and tests | Working | `src/lib`, `src/tool-handlers`, `npm test`, sample JSON docs |
| `hannah-data.ts` correctness | Working | 17 years, six domains, four live product sites plus Ask Hannah MCP live on Railway, correct metrics |
| LaidOffRise MCP listing | Working | Listed in project data as building. Server designed and architected, not yet deployed. |
| EclipseLink in project list | Not included | Intentionally omitted. EclipseLink is in early development and is not portfolio-ready. Generation prompts are already instructed not to mention it. |
| Rate limiting | Not implemented | Low-traffic use case; Railway restarts handle abuse recovery; acceptable for current scope |
| Authentication | Not implemented | Intentional: public professional data does not require auth; adds friction for the hiring audience |

---

## Section 7 - Portfolio copy

### Card summary (work page grid)

A live MCP server that turns Hannah's professional portfolio into a queryable data layer for AI systems. Ten tools. Deployed to Railway. Registered in Claude.ai.

### Project description (case study hero)

Most portfolios are static websites. Ask Hannah MCP is a live API that AI systems can call directly. Recruiters and hiring managers who connect it to Claude can query her background, projects, metrics, voice statements, and a role-focused hiring brief the same way they would query any other data source. The product demonstrates in its own structure what it claims about the builder: she understands how AI systems connect to each other, how to design tools for agentic workflows, and how to ship infrastructure that works. Ten structured tools. The structured data in this server is the canonical fact source for Hannah's professional content.

### Problem statement

The standard portfolio format has not changed since 2010. A recruiter arrives, clicks, decides in thirty seconds, and moves on. That format is not built for a world where AI assistants are embedded in hiring workflows. Ask Hannah MCP is a structured data layer that integrates into the tools hiring managers already use instead of asking them to visit another website.

### Process steps (work page display)

**Step 1 - Tool schema design.**
Ten tools, each scoped to a single job. Profile, voice, projects, metrics, skills, FAQ answers, hiring brief, and generation. Schema clarity was the first decision because downstream AI synthesis is only as good as the structure it receives.

**Step 2 - Data contract and voice consistency.**
`hannah-data.ts` is the single source of truth for content. Voice statements are first-person and human, not formal third-person summaries, because the downstream audience is a human reading AI-synthesized output. The distinction shapes how every tool response reads.

**Step 3 - Transport, reliability, and conversion.**
The stdio build worked locally and failed at registration. The HTTP MCP transport rebuild was one pivot but a necessary one. Railway auto-deploys on push. The server is stateless by design. Ten tools, one endpoint, zero database. Later passes added trust metadata, hiring-brief depth, explicit contact ordering, and tests so the system stays credible as it grows.

### Impact line

Any hiring manager with a Claude.ai account can connect this server right now and ask it anything. It will answer from structured data Hannah controls. That is a different kind of leave-behind.

### Honest summary

**Technical understanding:**
Understands MCP transport architecture well enough to identify and fix the stdio versus public HTTP mismatch that blocked registration. Applied strict generation contracts and standardized error handling to resume and cover letter tools. Refactored into modules with tests so changes do not regress silently. Stateless by design was a conscious tradeoff, not a gap.

**Product understanding:**
Scoped out a fit-scoring tool that would have been technically interesting but created product liability in a job search context. Made the voice tool distinct from the profile tool because the downstream synthesis use case for each is different. Added a hiring brief and conversion path so screening does not dead-end after reading. Designed for a specific user journey: hiring manager opens Claude, connects the server, asks questions, gets grounded answers, moves to outreach.

**Design understanding:**
The UX of an MCP tool is its schema. Field names, return shape, and the structure of voice answers are all design decisions that affect how the synthesized output reads to a human. "She has 17 years of experience" is a third-person summary. "I did not come to AI from a whiteboard. I came from the floor." is a voice statement. Same fact, different tool, different output. That distinction was designed, not accidental.

### What this demonstrates (recruiter-facing)

Hannah built a live MCP server, deployed it to production, registered it as a Claude.ai connector, and shipped it as a functional product. She understands the agentic AI infrastructure layer well enough to build for it, not just write about it.

### One honest line for technical interviews

Ten MCP tools over HTTP with Zod input validation, strict generation contracts, streamable MCP transport, modular handlers, automated tests, stateless Railway deployment, and a TypeScript data module that is the single source of truth for professional content.

### One honest line for product interviews

I identified a real gap in how portfolios work for AI PM roles, designed a product that closes it by meeting hiring managers where their AI tools already live, scoped out the features that would have created liability, and shipped something a recruiter can actually use right now without asking them to change their behavior.

### Business model framing

Ask Hannah MCP is not a commercial product. It is a job search artifact and a portfolio proof point. Its value is not revenue: it is that the act of using it demonstrates exactly what it claims about the person who built it.

---

## Section 8 - Citations

There are no external citations for this case study. All claims are based on direct implementation experience, observed tool behavior in live testing, and the MCP specification documented at modelcontextprotocol.io.

---

*Case study written April 2026. Hannah Kraulik Pagade, Rohimaya Health AI.*
