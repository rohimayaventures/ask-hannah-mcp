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

## `hannah_generate_resume` / `hannah_generate_cover_letter`

```json
{
  "document": "resume",
  "text": "Generated document body...",
  "provenance": "Generated from verified profile and project data in this MCP. No fabricated employers, metrics, dates, or accomplishments are permitted.",
  "profileDataLastUpdated": "2026-04-09",
  "mcpContentSetLastUpdated": "2026-04-09"
}
```
