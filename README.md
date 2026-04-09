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
- If resume/cover-letter generation fails, confirm `ANTHROPIC_API_KEY` is present and valid in Railway Variables.
- If generation returns empty output, retry with a shorter JD (3-6 key requirements instead of full boilerplate).
- For metric trust details, request JSON from `hannah_get_metrics` and review `evidenceTag` + `confidenceNote`.

## Current Capabilities

- Role-focused hiring briefs support both concise decision mode (`summary`) and deep-dive mode (why now, scorecards, 30/60/90, risks/mitigations, interview prompts).
- Metrics JSON includes trust metadata (`evidenceTag` and `confidenceNote`) to speed up screening confidence.
- Resume and cover-letter tools are constrained to verified source data and return standardized error codes with actionable next steps.
- Freshness metadata is included in outputs and controlled by environment variables.
- Direct contact conversion supports email, Calendly, optional Zoom booking, LinkedIn, preferred contact method, response-time SLA, timezone, and optional UTM/event suffix controls.

## Contact Conversion Setup (Phase 4)

Set these in Railway Variables to enable direct recruiter contact conversion:

- `CONTACT_EMAIL`
- `CALENDLY_URL`
- `ZOOM_BOOKING_URL` (optional)
- `LINKEDIN_URL`
- `PREFERRED_CONTACT_METHOD` (for example `calendly` or `email`)
- `CONTACT_RESPONSE_TIME_HOURS` (for example `24`)
- `CALENDLY_UTM_SOURCE` (for source tracking, for example `ask-hannah-mcp`)
- `CONTACT_TIMEZONE` (for example `America/Denver`)
- `BOOKING_CTA_LABEL` (for example `Book a discovery call`)
- `CALENDLY_EVENT_TYPE` (optional path suffix for event-specific booking links)

Calendly URL rule:

- If `CALENDLY_URL` is already a full event link, leave `CALENDLY_EVENT_TYPE` empty.
- If `CALENDLY_URL` is only your Calendly handle/root URL, set `CALENDLY_EVENT_TYPE` to the event slug.

## Environment Variables (Source of Truth)

- Railway Variables are the production source of truth.
- `.env.example` is the safe template (placeholders only).
- `.env.local` is local-only runtime config and should contain real local secrets/values.
- Runtime precedence in this project is: explicit env vars -> code defaults from `src/hannah-data.ts`/runtime fallbacks.

## Local Development

```bash
npm install
npm run dev
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
9. Copy the Railway public URL and add `/mcp` as your Claude connector

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
