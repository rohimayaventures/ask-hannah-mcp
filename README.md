# Ask Hannah MCP Server

An MCP (Model Context Protocol) server that helps recruiters and hiring managers evaluate Hannah Kraulik Pagade quickly using structured evidence, role-focused hiring briefs, live product links, and tailored resume/cover-letter generation inside Claude or any MCP-compatible AI tool.

## Connect to Claude

1. Open Claude.ai
2. Go to Settings > Connectors
3. Click "Add custom connector"
4. Enter the server URL: `https://your-railway-url.railway.app/mcp`
5. Ask Claude anything about Hannah's work

## Tools Available

| Tool | Description |
|---|---|
| `hannah_get_profile` | Full professional profile, positioning, target roles, contact info |
| `hannah_list_projects` | All portfolio projects with status, taglines, and URLs |
| `hannah_get_project_detail` | Deep dive on any specific project including decisions and stack |
| `hannah_get_metrics` | Validated clinical and product impact metrics |
| `hannah_get_skills` | Complete skill set across product, technical, and domain |
| `hannah_get_voice` | First-person voice answers to common hiring questions |
| `hannah_answer_question` | Direct answers for recruiter and hiring manager FAQs |
| `hannah_get_hiring_brief` | One-page recruiter brief with role-focused fit, proof points, and interview angles |
| `hannah_generate_resume` | Tailored resume generation using verified source data |
| `hannah_generate_cover_letter` | Tailored cover letter generation using verified source data |

## Data Freshness

- Profile data last updated: sourced from `PROFILE_DATA_LAST_UPDATED` (falls back to a default in `src/hannah-data.ts`)
- MCP content set last updated: sourced from `MCP_CONTENT_SET_LAST_UPDATED` (falls back to current UTC date at runtime)

## Resume and cover letter generation (operations)

Generation tools call the Anthropic Messages API with **non-streaming** requests. Operational behavior:

- **Model selection:** `ANTHROPIC_MODEL_RESUME` and `ANTHROPIC_MODEL_COVER_LETTER` override the model per tool; if unset, `ANTHROPIC_MODEL` applies to both; if that is unset, the server uses the default in `src/lib/model-env.ts` (currently `claude-sonnet-4-20250514`).
- **Structured documents (Phase 2):** The main model returns **JSON** for resume and cover letter. The server validates with **Zod** (`src/lib/generation-schemas.ts`), then renders **deterministic Markdown** (`render-resume-markdown.ts`, `render-cover-letter-markdown.ts`). **Name, title, location, email, portfolio, LinkedIn, and GitHub** on the resume are taken from `hannah-data` profile fields, not from the model. Successful tool responses include `structuredContent.documentJson` with the validated object. If the model emits invalid JSON or fails schema checks, you get `ERR_RESUME_JSON`, `ERR_RESUME_SCHEMA`, `ERR_COVER_LETTER_JSON`, or `ERR_COVER_LETTER_SCHEMA` with a short field hint (no posting text in logs). Tune output headroom with `RESUME_GENERATION_MAX_TOKENS` (default `6144`) and `COVER_LETTER_GENERATION_MAX_TOKENS` (default `3072`). Override the resume footer line with `RESUME_PDF_CTA_LINE` if your public URL changes.
- **Fact verification (Phase 3):** After Zod validation, model-owned resume and cover letter text is checked against a normalized corpus built from `hannah-data` (`src/lib/generation-fact-verify.ts`): disallowed references from generation rules, incorrect “15 years” experience framing, and quantitative patterns (for example `$…`, `NN%`, common verified phrases such as `130+ people` and `90 days`) must appear in that corpus or the tool returns `ERR_RESUME_FACT_DRIFT` / `ERR_COVER_LETTER_FACT_DRIFT`. Disable only for emergencies with `GENERATION_FACT_VERIFY_ENABLED=0`.
- **ATS modes (Phase 4):** Both generation tools accept **`atsMode`**: `markdown` (default), `plain` (ATS-oriented plain text: no `#` headings or `**bold**`; uppercase name line; `SUMMARY` / `SKILLS` / `EXPERIENCE` / `PROJECTS` / `EDUCATION` labels; profile links expanded to `label — url`), or `plain_dense` (tighter line breaks). Non-markdown modes add prompt rules so JSON strings stay plain (no markdown/HTML inside fields) and JOB SIGNALS vocabulary aligns only with verified skill lines. Successful responses include `structuredContent.textFormat` (`markdown` | `plain`) and `structuredContent.atsMode`. Generation telemetry includes `atsMode`.
- **Retries:** Transient failures (for example 429, timeouts, connection resets) retry with exponential backoff. Tune with `ANTHROPIC_RETRY_MAX_ATTEMPTS` (default `3`) and `ANTHROPIC_RETRY_BASE_MS` (default `1000`).
- **Job description extraction (Phase 1):** When enabled (default), postings longer than `JD_EXTRACT_SKIP_LLM_UNDER_CHARS` (default `2800`) are sent to a **separate** Anthropic Messages call that returns **JSON only** (Zod-validated). The structured fields are rendered into a compact **JOB SIGNALS** block for the main resume or cover letter call, which reduces tokens and noise. The extractor model defaults to `claude-3-5-haiku-20241022` and is overridden by `ANTHROPIC_MODEL_JD_EXTRACT` or `ANTHROPIC_MODEL`. Set `JD_EXTRACT_ENABLED=0` to pass every posting through verbatim. If extraction fails or returns empty text, the server falls back to a **deterministic excerpt** of the posting (still no secrets in logs). Tune input cap, excerpt size, and extractor `max_tokens` with `JD_EXTRACT_MAX_INPUT_CHARS`, `JD_EXTRACT_FALLBACK_EXCERPT_CHARS`, and `JD_EXTRACT_MAX_TOKENS`.
- **Telemetry:** Each extraction pass emits **`event: "jd_extract"`** on stderr (raw and prompt character counts, `extractUsed`, `extractMs`, `model`, `attempts`, `ok`, and error codes such as `ERR_JD_EXTRACT_PARSE` / `ERR_JD_EXTRACT_EMPTY` when relevant—**never the posting text**). Each finished generation attempt emits **`event: "generation"`** with tool name, `ok`, `durationMs`, `jdChars` (original posting length), `jdPromptChars` (length of the posting material actually inserted into the main prompt), `jdExtractUsed`, `jdExtractOk`, job title and company lengths, `model`, optional `attempts`, optional **`atsMode`** (Phase 4), and on failure `errorCode` / `httpStatus`. Point Railway log drains at these lines for dashboards.
- **Rate limiting (optional):** Set `MCP_RATE_LIMIT_ENABLED=1` to enable a sliding-window cap on **`POST /mcp`** per client IP (`MCP_RATE_LIMIT_MAX`, default `120`; `MCP_RATE_LIMIT_WINDOW_MS`, default `60000`). Disabled by default so normal Claude connector traffic is unaffected.
- **Proxy IP:** By default the server sets Express `trust proxy` to `1` so `X-Forwarded-For` works on Railway. Set `TRUST_PROXY=0` to disable.

See `ASK-HANNAH-MCP-CASE-STUDY.md` (Section 4, Generation hardening roadmap) for shipped Phases 0–4 and planned Phase 5 export/handoff work.

## Example Questions to Ask Claude

- "Who is Hannah Kraulik Pagade and what is she looking for?"
- "Show me her live products"
- "Tell me about OrixLink AI in depth"
- "What are her validated clinical metrics?"
- "Does she know prompt engineering and MCP?"
- "What design systems has she built?"

## Recruiter Quick Start

Start here first: run `hannah_get_hiring_brief` before any other tool.

Use these prompts to evaluate fit quickly:

- "Give me a 60-second hiring brief for `conversational-ai-pm`."
- "Why is Hannah a fit for `ux-ai`?"
- "Show top 3 validated proof points for `head-of-product`."
- "Generate a tailored resume for this JD: [paste full job description]."
- "Generate an ATS plain-text resume for this JD (use `atsMode: plain` or `plain_dense` on the generation tool)."
- "Generate a tailored cover letter for this JD: [paste full job description]."

Supported hiring-brief focus values:

- `founding-pm`
- `head-of-product`
- `ai-pm`
- `ux-ai`
- `healthcare-ai`
- `general-ai`
- `conversational-ai-pm`
- `conversational-ai-ux-design`
- `general-ai-product`

Canonical role lenses used internally:

- `ai-pm` (aliases: `conversational-ai-pm`, `pm`, `conversational-ai`)
- `ux-ai` (aliases: `conversational-ai-ux-design`, `ux-design`)
- `general-ai` (aliases: `general-ai-product`, `general`)
- `founding-pm`, `head-of-product`, `healthcare-ai`

Use `format: "summary"` on `hannah_get_hiring_brief` for a compact decision view.

Concrete example (tool arguments):

```json
{
  "focus": "conversational-ai-pm",
  "format": "summary"
}
```

## 2-Minute Evaluation Flow

1. Run `hannah_get_hiring_brief` with a role focus.
2. Open at least 2 live product links from the brief.
3. Review top quantified outcomes and role-specific strengths.
4. Generate a tailored resume or cover letter only if needed.

## Troubleshooting

- If Claude summarizes tool output instead of showing it directly, prompt: "Paste the tool output only with no extra commentary."
- If connector setup fails, confirm your URL ends with `/mcp` and test `https://your-url/health` first.
- If resume/cover-letter generation fails, confirm `ANTHROPIC_API_KEY` is present and valid in Railway Variables and that any custom `ANTHROPIC_MODEL*` value is available to your Anthropic account.
- If generation returns empty output, retry with a shorter JD (3-6 key requirements instead of full boilerplate).
- If you see `ERR_RESUME_SCHEMA` / `ERR_COVER_LETTER_SCHEMA`, the model returned JSON that failed validation; retry the tool once, or raise `RESUME_GENERATION_MAX_TOKENS` / `COVER_LETTER_GENERATION_MAX_TOKENS` if responses are truncated.
- If you see `ERR_RESUME_FACT_DRIFT` / `ERR_COVER_LETTER_FACT_DRIFT`, the model added claims that do not match verified `hannah-data` under the Phase 3 checks; retry once with a shorter JD. Use `GENERATION_FACT_VERIFY_ENABLED=0` only as a temporary escape hatch.
- For metric trust details, request JSON from `hannah_get_metrics` and review `evidenceTag` + `confidenceNote`.
- The root endpoint (`/`) includes `contactHealth.warnings` for non-secret contact/config issues (missing URLs, malformed contact values, etc.).
- On startup, the server logs non-secret contact/config warnings so invalid settings are visible immediately.

## Current Capabilities

- Role-focused hiring briefs support both concise decision mode (`summary`) and deep-dive mode (why now, scorecards, 30/60/90, risks/mitigations, interview prompts).
- Hiring briefs now include `scoreRationale`, compact founder-concern coverage in `summary`, proof-source pointers, and optional role-specific 90-day KPI targets.
- Conversion-oriented hiring summaries include a decision recommendation line and explicit contact fallback order.
- Metrics JSON includes trust metadata (`evidenceTag` and `confidenceNote`) to speed up screening confidence.
- Resume and cover-letter tools use a **JSON-then-render** pipeline: Zod-validated document objects, **Phase 3** server-side fact checks on model-owned text, **Phase 4** optional ATS-oriented plain-text rendering via `atsMode`, deterministic Markdown when `atsMode` is `markdown`, and optional `documentJson` on success; they are constrained to verified source data in prompts and return standardized error codes (`ERR_*_JSON` / `ERR_*_SCHEMA` / `ERR_*_FACT_DRIFT`). The API layer uses configurable models, bounded retries, structured stderr telemetry (no job description content in logs), and for longer postings a validated JSON extraction pass that feeds compact JOB SIGNALS into the main generator (with excerpt fallback and `jd_extract` logs).
- Freshness metadata is included in outputs and controlled by environment variables.
- Direct contact conversion supports email, Calendly, optional Zoom booking, LinkedIn, preferred contact method, response-time SLA, timezone, and optional UTM/event suffix controls.
- Contact order for recruiter follow-up is explicit: Calendly -> LinkedIn -> Email.
- Code is modularized for maintainability: role/focus normalization, contact/freshness helpers, and tool handlers are separated under `src/lib` and `src/tool-handlers`.
- Test coverage exists for role normalization, Calendly URL handling, metric evidence tagging, Anthropic retry helpers, generation and JD-extract model env resolution, JD JSON parsing, resume/cover document parse and render helpers, generation fact verification (Phase 3), ATS render modes (Phase 4), and max-token env helpers via `npm test`.
- Sample tool JSON payloads are documented in `docs/sample-json-outputs.md`.

## Contact Conversion Setup

Set these in Railway Variables to enable direct recruiter contact conversion:

- `CONTACT_EMAIL`
- `CALENDLY_URL`
- `ZOOM_BOOKING_URL` (optional)
- `LINKEDIN_URL`
- `PREFERRED_CONTACT_METHOD` (for example `calendly` or `email`)
- `CONTACT_RESPONSE_TIME_HOURS` (for example `24`)
- `CALENDLY_UTM_SOURCE` (for source tracking, for example `ask-hannah-mcp`)
- `CONTACT_UTM_SOURCE` (recommended global source tracking for Calendly, LinkedIn, and Zoom links)
- `CONTACT_TIMEZONE` (for example `America/Denver`)
- `BOOKING_CTA_LABEL` (for example `Book a discovery call`)
- `CALENDLY_EVENT_TYPE` (optional path suffix for event-specific booking links)

Calendly URL rule:

- If `CALENDLY_URL` is already a full event link, leave `CALENDLY_EVENT_TYPE` empty.
- If `CALENDLY_URL` is only your Calendly handle/root URL, set `CALENDLY_EVENT_TYPE` to the event slug.

Contact fallback order:

- Hiring outputs prioritize follow-up in this order: `Calendly -> LinkedIn -> Email`.

## Environment Variables (Source of Truth)

- Railway Variables are the production source of truth.
- `.env.example` is the safe template (placeholders only).
- `.env.local` is local-only runtime config and should contain real local secrets/values.
- Runtime precedence in this project is: explicit env vars -> code defaults from `src/hannah-data.ts`/runtime fallbacks.

## Local Development

```bash
npm install
npm run dev
npm test
```

## Deploy to Railway

1. Push this repo to GitHub under `rohimayaventures/ask-hannah-mcp`
2. Create a new Railway project
3. Connect the GitHub repo
4. Railway auto-detects Node.js and deploys
5. Set `BASE_URL` environment variable to your Railway URL
6. Set `PROFILE_DATA_LAST_UPDATED` to the date your profile data was last refreshed (for example `2026-04-09`)
7. Optionally set `MCP_CONTENT_SET_LAST_UPDATED` to your deploy date (if not set, it auto-falls back to the current UTC date)
8. Optional metadata:
   - `APP_VERSION` (defaults to `npm_package_version` or `1.0.0`)
   - `BUILD_DATE` (defaults to MCP content-set date)
   - `GIT_SHA` (defaults to `unknown`)
9. Optional generation and HTTP hardening (see `.env.example`):
   - `ANTHROPIC_MODEL`, `ANTHROPIC_MODEL_RESUME`, `ANTHROPIC_MODEL_COVER_LETTER`, `ANTHROPIC_MODEL_JD_EXTRACT`
   - `ANTHROPIC_RETRY_MAX_ATTEMPTS`, `ANTHROPIC_RETRY_BASE_MS`
   - `JD_EXTRACT_ENABLED`, `JD_EXTRACT_SKIP_LLM_UNDER_CHARS`, `JD_EXTRACT_MAX_INPUT_CHARS`, `JD_EXTRACT_FALLBACK_EXCERPT_CHARS`, `JD_EXTRACT_MAX_TOKENS`
   - `RESUME_GENERATION_MAX_TOKENS`, `COVER_LETTER_GENERATION_MAX_TOKENS`, `RESUME_PDF_CTA_LINE`, `GENERATION_FACT_VERIFY_ENABLED` (default on; set to `0` to disable Phase 3 checks only if needed)
   - `TRUST_PROXY` (set to `0` only if you must disable proxy trust)
   - `MCP_RATE_LIMIT_ENABLED`, `MCP_RATE_LIMIT_MAX`, `MCP_RATE_LIMIT_WINDOW_MS` (off unless you enable the limiter)
10. Copy the Railway public URL and add `/mcp` as your Claude connector

## Tech Stack

- TypeScript
- MCP SDK (`@modelcontextprotocol/sdk`)
- Express (HTTP transport)
- Zod (input validation)
- Railway (deployment)

## Contact

- Portfolio: https://hannahkraulikpagade.com
- LinkedIn: https://www.linkedin.com/in/hannah-pagade
- Email: hannah.pagade@gmail.com
