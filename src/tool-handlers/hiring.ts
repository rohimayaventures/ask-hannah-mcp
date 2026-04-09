import { canonicalRoleLabels, normalizeRoleFocus, type CanonicalRoleFocus } from "../lib/roles.js";

type Freshness = {
  profileDataLastUpdated: string;
  mcpContentSetLastUpdated: string;
};

type HiringDeps = {
  profile: any;
  metrics: any;
  projects: any[];
  contactOptions: any;
  freshness: Freshness;
  anonymizationNotice: string;
};

export function handleGetHiringBrief(
  args: { focus: string; format: "markdown" | "json" | "summary" },
  deps: HiringDeps
) {
  const { focus, format } = args;
  const { profile, metrics, projects, contactOptions, freshness, anonymizationNotice } = deps;
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
  const topProofPoints = [metrics.operations[0]?.metric, metrics.product[2]?.metric, metrics.product[3]?.metric].filter(
    Boolean
  ) as string[];
  const proofSourcePointers = [
    {
      claim: metrics.operations[0]?.metric ?? "Led high-scale operations outcomes.",
      sourceType: "operations_metric",
      reference: metrics.operations[0]
        ? `${metrics.operations[0].context} (${metrics.operations[0].employer}, ${metrics.operations[0].dates})`
        : "Operations metric in structured profile data",
    },
    {
      claim: metrics.product[2]?.metric ?? "Improved conversational efficiency outcomes.",
      sourceType: "product_metric",
      reference: metrics.product[2] ? `${metrics.product[2].context}` : "Product metric in structured profile data",
    },
    {
      claim: metrics.product[3]?.metric ?? "Shipped research-backed UX improvements.",
      sourceType: "product_metric",
      reference: metrics.product[3] ? `${metrics.product[3].context}` : "Product metric in structured profile data",
    },
    {
      claim: "Built and shipped multiple public AI products.",
      sourceType: "live_product_links",
      reference: topLiveLinks.map((x) => `${x.name} (${x.url})`).join(" | "),
    },
  ];

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

  const scorecardByFocus: Record<
    CanonicalRoleFocus,
    { speed_to_value: number; execution_depth: number; cross_functional_leadership: number; ai_safety_maturity: number }
  > = {
    "founding-pm": { speed_to_value: 5, execution_depth: 5, cross_functional_leadership: 5, ai_safety_maturity: 4 },
    "head-of-product": { speed_to_value: 4, execution_depth: 5, cross_functional_leadership: 5, ai_safety_maturity: 4 },
    "ai-pm": { speed_to_value: 4, execution_depth: 4, cross_functional_leadership: 4, ai_safety_maturity: 5 },
    "ux-ai": { speed_to_value: 4, execution_depth: 4, cross_functional_leadership: 4, ai_safety_maturity: 5 },
    "healthcare-ai": { speed_to_value: 4, execution_depth: 4, cross_functional_leadership: 4, ai_safety_maturity: 5 },
    "general-ai": { speed_to_value: 4, execution_depth: 4, cross_functional_leadership: 4, ai_safety_maturity: 4 },
  };

  const scoreRationaleByFocus: Record<
    CanonicalRoleFocus,
    { speed_to_value: string; execution_depth: string; cross_functional_leadership: string; ai_safety_maturity: string }
  > = {
    "founding-pm": {
      speed_to_value: "Repeated 0-to-1 delivery with constrained scope and fast iteration loops.",
      execution_depth: "Hands-on ownership across strategy, UX, prompts, implementation details, and launch quality.",
      cross_functional_leadership:
        "Strong alignment and decision making across founders, design, and engineering under ambiguity.",
      ai_safety_maturity: "Operationalized escalation and guardrail thinking in shipped conversational systems.",
    },
    "head-of-product": {
      speed_to_value: "Moves from diagnosis to roadmap decisions quickly while preserving measurable outcomes.",
      execution_depth: "Balances system-level product strategy with practical execution accountability.",
      cross_functional_leadership: "Leads stakeholder alignment and prioritization in complex environments.",
      ai_safety_maturity: "Applies trust and quality standards to AI releases with governance discipline.",
    },
    "ai-pm": {
      speed_to_value: "Prioritizes high-value AI use cases and ships outcome-oriented improvements quickly.",
      execution_depth: "Converts user goals into model behavior requirements, evaluation loops, and release plans.",
      cross_functional_leadership: "Coordinates product, engineering, and design trade-offs around quality and speed.",
      ai_safety_maturity: "Strong explicit framework for guardrails, escalation behavior, and failure handling.",
    },
    "ux-ai": {
      speed_to_value: "Targets trust and comprehension friction first to unlock fast user experience gains.",
      execution_depth: "Conversation design decisions are grounded in implementation realities and edge cases.",
      cross_functional_leadership: "Bridges research, design, and engineering to deliver coherent interaction systems.",
      ai_safety_maturity: "Designs with robust fallback and escalation behavior beyond happy-path interactions.",
    },
    "healthcare-ai": {
      speed_to_value: "Identifies highest-impact safe pathways early in regulated and high-risk product contexts.",
      execution_depth: "Combines clinical operations depth with production conversational AI execution.",
      cross_functional_leadership: "Aligns clinical, compliance, and product partners on safe delivery decisions.",
      ai_safety_maturity: "High maturity in risk triage, refusal boundaries, and escalation-driven trust architecture.",
    },
    "general-ai": {
      speed_to_value: "Drives practical AI outcomes quickly by focusing on validated user and business impact.",
      execution_depth: "Comfortable across strategy, UX, and shipping mechanics across multiple domains.",
      cross_functional_leadership: "Builds execution momentum through clear, cross-functional decision frameworks.",
      ai_safety_maturity: "Applies reliable trust and quality standards to real-world AI product behavior.",
    },
  };

  const kpiTargetsByFocus: Record<CanonicalRoleFocus, { day90Targets: string[] }> = {
    "founding-pm": {
      day90Targets: [
        "Launch first core workflow with >=20% improvement in completion or conversion baseline.",
        "Reduce critical failure-mode rate by >=30% from week-1 baseline.",
        "Establish weekly product-quality scorecard used by product/design/engineering.",
      ],
    },
    "head-of-product": {
      day90Targets: [
        "Align roadmap to 3-5 high-leverage bets with explicit KPI ownership.",
        "Increase on-time delivery predictability by >=20% through operating cadence improvements.",
        "Stand up portfolio scorecard with quality, adoption, and business outcome signals.",
      ],
    },
    "ai-pm": {
      day90Targets: [
        "Improve AI workflow completion/success by >=15% on highest-value use case.",
        "Cut unresolved high-severity trust/safety defects by >=30%.",
        "Establish release checklist with evaluation gates adopted by delivery team.",
      ],
    },
    "ux-ai": {
      day90Targets: [
        "Increase conversational flow completion by >=15% in top user journeys.",
        "Reduce escalation/handoff breakdowns by >=25% through improved dialogue design.",
        "Publish reusable conversation patterns adopted in at least 2 shipping flows.",
      ],
    },
    "healthcare-ai": {
      day90Targets: [
        "Improve safe-completion rates on priority care pathways by >=15%.",
        "Reduce ambiguous/high-risk response incidents by >=30%.",
        "Operationalize clinical AI review cadence with documented go/no-go criteria.",
      ],
    },
    "general-ai": {
      day90Targets: [
        "Deliver >=2 high-impact AI improvements with measurable usage or conversion lift.",
        "Reduce top friction points in AI journeys by >=20% based on user behavior data.",
        "Implement shared quality KPI dashboard for AI feature iteration.",
      ],
    },
  };

  const roleSpecificCallByFocus: Record<CanonicalRoleFocus, string> = {
    "founding-pm": "0-to-1 product strategy call",
    "head-of-product": "product leadership fit call",
    "ai-pm": "AI product manager fit call",
    "ux-ai": "conversational AI UX design fit call",
    "healthcare-ai": "healthcare AI product fit call",
    "general-ai": "AI product fit call",
  };

  const bookingUrl = contactOptions.calendlyUrl || contactOptions.zoomBookingUrl;
  const bookingInstruction = bookingUrl
    ? `${contactOptions.bookingCtaLabel} (${roleSpecificCallByFocus[normalizedFocus]}): ${bookingUrl}`
    : `Email ${contactOptions.email} with the role title and job description`;

  const data = {
    candidateSnapshot:
      "AI product leader across product management and UX design with 17 years of high-stakes operating experience and multiple live AI products. Strong in strategy and execution, with depth in conversational AI behavior, trust design, and shipping velocity.",
    whyNowTransition:
      "Now is the right moment because this role benefits from a builder who can move across strategy, UX, and implementation while keeping outcomes measurable and trust-centered.",
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
    scoreRationale: scoreRationaleByFocus[normalizedFocus],
    kpiTargets: kpiTargetsByFocus[normalizedFocus],
    proofSourcePointers,
    contactOptions,
    freshness: {
      profileDataLastUpdated: freshness.profileDataLastUpdated,
      mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
    },
    anonymizationNotice,
    nextStepCTA: `Best next step: ${bookingInstruction}. You can also connect on LinkedIn at ${contactOptions.linkedinUrl}. Expected response time is within ${contactOptions.responseTimeHours} hours.`,
  };

  if (format === "json") {
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data };
  }

  if (format === "summary") {
    const topFounderConcernsAddressed = data.founderRisksAndMitigations
      .slice(0, 2)
      .map((x) => `${x.risk} -> ${x.mitigation}`)
      .join(" | ");
    const summary = `# Hiring Summary — ${profile.name}

- Focus requested: ${focus}
- Focus applied: ${data.roleLens}
- Top proof points: ${data.topProofPoints.join(" | ")}
- Top founder concerns addressed: ${topFounderConcernsAddressed}
- Availability: ${data.availability}
- Location: ${data.location} (Relocation: ${data.relocation.openToRelocation ? "Yes" : "No"})
- Why now: ${data.whyNowTransition}
- Next step: ${data.nextStepCTA}`;
    return { content: [{ type: "text" as const, text: summary }], structuredContent: data };
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

## Optional KPI Targets (First 90 Days)
${data.kpiTargets.day90Targets.map((x) => `- ${x}`).join("\n")}

## Proof Source Pointers
${data.proofSourcePointers.map((x) => `- Claim: ${x.claim}\n  Source: ${x.sourceType}\n  Reference: ${x.reference}`).join("\n")}

## Notes
- ${data.anonymizationNotice}
- Profile data last updated: ${data.freshness.profileDataLastUpdated}
- MCP content set last updated: ${data.freshness.mcpContentSetLastUpdated}

## Recommended Next Step
${data.nextStepCTA}`;

  return { content: [{ type: "text" as const, text: md }], structuredContent: data };
}
