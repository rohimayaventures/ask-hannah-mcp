# Sample JSON Outputs

This file shows representative JSON structures for key tools so future changes can be validated quickly.

## `hannah_get_profile` (`format: "json"`)

```json
{
  "name": "Hannah Kraulik Pagade",
  "positioning": "AI Product Manager and Conversational AI UX Designer",
  "targetRoles": [
    "Conversational AI Product Manager",
    "Conversational AI UX Design"
  ],
  "contactOptions": {
    "preferredContactMethod": "calendly",
    "calendlyUrl": "https://calendly.com/your-handle/20min-intro?utm_source=ask-hannah-mcp"
  },
  "profileDataLastUpdated": "2026-04-09",
  "mcpContentSetLastUpdated": "2026-04-09"
}
```

## `hannah_get_metrics` (`format: "json"`)

```json
{
  "operations": [
    {
      "metric": "Example metric",
      "context": "Example context",
      "evidenceTag": "operational_leadership",
      "confidenceNote": "Measured outcome tied to leadership and operational execution."
    }
  ],
  "product": [
    {
      "metric": "Example product metric",
      "context": "Example product context",
      "evidenceTag": "research_validated",
      "confidenceNote": "Evidence-backed outcome from documented project or operations context."
    }
  ],
  "anonymizationNotice": "Some employer names are intentionally anonymized..."
}
```

## `hannah_get_hiring_brief` (`format: "json"`)

```json
{
  "focusRequested": "conversational-ai-pm",
  "focusApplied": "ai-pm",
  "roleScorecard": {
    "speed_to_value": 4,
    "execution_depth": 4,
    "cross_functional_leadership": 4,
    "ai_safety_maturity": 5
  },
  "scoreRationale": {
    "speed_to_value": "Prioritizes high-value AI use cases and ships outcome-oriented improvements quickly."
  },
  "kpiTargets": {
    "day90Targets": [
      "Improve AI workflow completion/success by >=15% on highest-value use case."
    ]
  },
  "proofSourcePointers": [
    {
      "claim": "Example claim",
      "sourceType": "product_metric",
      "reference": "Example reference"
    }
  ],
  "decisionRecommendation": "Recommendation: Advance to AI PM interview with emphasis on trust, evaluation, and delivery discipline.",
  "contactFallbackOrder": [
    {
      "method": "calendly",
      "label": "Book a discovery call (AI product manager fit call)",
      "value": "https://calendly.com/your-handle/20min-intro?utm_source=ask-hannah-mcp"
    },
    {
      "method": "linkedin",
      "label": "Connect on LinkedIn",
      "value": "https://www.linkedin.com/in/your-profile?utm_source=ask-hannah-mcp"
    },
    {
      "method": "email",
      "label": "Email",
      "value": "your.email@example.com"
    }
  ]
}
```

## `hannah_generate_resume` (success `structuredContent`, illustrative)

After Zod validation, Phase 3 fact verification (unless disabled), and Phase 4 rendering, MCP `structuredContent` resembles:

```json
{
  "document": "resume",
  "text": "# Hannah Kraulik Pagade\n\n**AI product leader...**\n\n## Summary\n...",
  "textFormat": "markdown",
  "atsMode": "markdown",
  "documentJson": {
    "summary": "First-person summary paragraph from the model.",
    "skills": ["Skill one", "Skill two", "Skill three"],
    "experience": [
      {
        "headline": "Role title | Context",
        "bullets": ["Impact bullet grounded in verified metrics only"]
      }
    ],
    "projects": [
      {
        "name": "OrixLink AI",
        "bullets": ["Live product proof point from verified data"]
      }
    ],
    "education": "MS, Artificial Intelligence and Machine Learning, University of Colorado Boulder, in progress, expected 2026"
  },
  "provenance": "Generated from verified profile and project data in this MCP. No fabricated employers, metrics, dates, or accomplishments are permitted.",
  "profileDataLastUpdated": "2026-04-09",
  "mcpContentSetLastUpdated": "2026-04-09"
}
```

With **`atsMode`: `plain`** or **`plain_dense`**, **`text`** is plain text (no `#` headings), and **`textFormat`** is **`plain`**.

Errors use tool `content` text such as `[ERR_RESUME_JSON]`, `[ERR_RESUME_SCHEMA]`, or `[ERR_RESUME_FACT_DRIFT]` (not shown here).

## `hannah_generate_cover_letter` (success `structuredContent`, illustrative)

```json
{
  "document": "cover_letter",
  "text": "Dear Hiring Team,\n\nFirst paragraph...\n\n",
  "textFormat": "markdown",
  "atsMode": "markdown",
  "documentJson": {
    "salutation": "Dear Hiring Team,",
    "paragraphs": [
      "First paragraph body.",
      "Second paragraph body.",
      "Third paragraph body."
    ],
    "signOff": "Sincerely,\nHannah Kraulik Pagade\nhannah.pagade@gmail.com"
  },
  "provenance": "Generated from verified profile and project data in this MCP. No fabricated employers, metrics, dates, or accomplishments are permitted.",
  "profileDataLastUpdated": "2026-04-09",
  "mcpContentSetLastUpdated": "2026-04-09"
}
```

Errors may include `[ERR_COVER_LETTER_JSON]`, `[ERR_COVER_LETTER_SCHEMA]`, or `[ERR_COVER_LETTER_FACT_DRIFT]`.
