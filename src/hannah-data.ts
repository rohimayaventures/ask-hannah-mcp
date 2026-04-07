// hannah-data.ts
// Single source of truth for all Ask Hannah MCP tools.
// Update this file when portfolio, projects, metrics, or positioning changes.
// Everything else reads from here automatically.

// ─── VOICE ANSWERS ────────────────────────────────────────────────────────────

export const voiceAnswers = {
  whatIDo: `I build AI products that actually ship, and I work across the whole thing. Figuring out what needs to exist, designing how it should feel, and making sure it gets out the door. I spent 17 years in environments where getting it wrong had real consequences for real people, and that shapes everything about how I approach product. I am not building from a whiteboard. I am building from experience.`,

  whatMakesMeDifferent: `Honestly, most people I come across have either the strategy or the execution. I have both. I can write the spec and I can ship the thing, and I have done it across six different domains with live products to show for it. I know how to take something from nothing to a working product fast, not by cutting corners but by being ruthless about what actually matters in the first version. I have built MVPs that went from idea to live in under 90 days while maintaining the architecture to grow on top of. What I think sets me apart most is that I understand the whole problem at once. The user experience, the model behavior, the trust architecture, the billing edge case at 2am. I did not learn that in a classroom. I learned it by doing it in environments where the stakes were real.`,

  howIWorkWithEngineering: `I genuinely love working with engineering teams and I think it shows. I speak enough of the language that they do not have to translate for me, and I try to do my homework before I ask for anything so I am not wasting their time. I have spent most of my career leading without direct authority, which means I learned early that you influence through credibility and respect, not through an org chart. I write specs people can actually work from, I show up to reviews, and I am in their corner when scope starts creeping in from all sides.`,

  whatBringsBestWork: `I thrive in environments that care about quality and move with intention. I love the 0 to 1 moment in a startup where what you build today becomes the foundation for everything that comes after. I have a growth mindset and I mean that genuinely. I am never sitting still. I am always asking what the company needs next and how I can be part of getting there. Open communication and real collaboration matter a lot to me. I love watching the people around me grow and succeed because when the team wins, the product wins. Whether I am leading or contributing I show up the same way every time.`,
};

// ─── ANTICIPATED QUESTIONS ────────────────────────────────────────────────────

export const anticipatedQuestions: Record<string, string> = {
  availability: `Two weeks from the time of offer is the standard. If there is a specific start date that matters for the role, the best thing to do is reach out directly through the contact page at hannahkraulikpagade.com and Hannah can work through that together with you.`,

  compensation: `Hannah prefers to have that conversation once there is mutual fit on both sides. It is worth the conversation first. You can reach her through the contact page at hannahkraulikpagade.com.`,

  remote: `Hannah is based in Westminster, Colorado and is open to relocation, hybrid arrangements, and fully remote roles. San Francisco is a preferred destination if relocating. She does not need a local role to consider an opportunity seriously.`,

  teamManagement: `Yes, and it goes deeper than managing a headcount. Hannah has spent years recruiting and hiring for roles where judgment under pressure mattered more than credentials, onboarding people into complex workflows, managing performance in environments where getting it wrong had downstream consequences, and building retention programs from scratch. She has led teams of 130 or more people. She has also built and operated as a solo founder. She is equally comfortable leading a team and being a strong individual contributor.`,

  enterpriseExperience: `She has worked with enterprise stakeholders at the C-suite level across multiple industries. ClearChannel by Vestara was built for an enterprise financial services context with fraud detection, bereavement handling, and compliance flag detection. FinanceLens AI was designed for institutional and professional investor use cases. She has led cross-functional programs across diverse teams without direct authority, influencing outcomes through domain credibility and stakeholder alignment.`,

  mvpBuilding: `This is genuinely one of her strongest areas. OrixLink AI went from concept to a live monetized product with Stripe subscriptions, credit packs, Google OAuth, and atomic usage enforcement in under 90 days. She is disciplined about what goes in a first version and ruthless about what does not. The architecture always has room to grow on top of it.`,

  discoveryProcess: `Hannah leads with direct observation and structured research before any solution work. She has run contextual inquiry, stakeholder interviews, time-motion studies, SUS scoring, think-aloud protocols, and usability testing across her product and operations work. She does not guess at pain points. She has lived most of them directly and uses formal research to validate and extend that instinct.`,

  inheritedProduct: `Starting fresh and inheriting something are genuinely different problems and she approaches them that way. With an inherited product she spends the first period listening, understanding the decisions that were made and why, and learning what users are actually doing versus what the spec says they should do before touching anything. From zero she moves faster because there is no existing trust to protect. She has done both.`,

  stakeholderConflict: `She addresses it directly and early. In her experience most stakeholder conflict comes from people optimizing for different things without realizing it. She names that explicitly, gets the competing priorities on the table, and works toward a shared definition of what winning looks like. The skill transfers across every context.`,

  whenProductIsNotWorking: `She looks at what the data is actually saying versus what she hoped it would say, and she tries to separate the product hypothesis from the execution quality. Sometimes the idea is right and the implementation is wrong. Sometimes the idea is wrong and you need to say that clearly. She has shipped things that did not work the way she expected and she treats that as the most useful information the product can give you.`,

  regulatedIndustries: `Yes, beyond healthcare. FinanceLens AI operates in financial services with compliance-oriented output framing. ClearChannel by Vestara was designed for enterprise financial contact centers with fraud detection, bereavement handling, and regulatory language awareness built in. She understands how to design AI products that operate responsibly in regulated contexts.`,

  aiSafetyAndEvaluation: `This is central to how she builds, not an afterthought. OrixLink has a full safety and guardrails framework including escalation trigger logic, refusal protocols for high-risk scenarios, urgency classification across four tiers, and a validation suite. HealthLiteracy AI has a two-pass verification architecture where a second Claude call checks translation completeness before it reaches the user. She thinks about model failure modes before she thinks about the happy path.`,

  thoughtLeadership: `She ships products instead of writing about shipping products. The live work is the thought leadership. That said she is an articulate communicator, a published author under a pen name, and someone who has facilitated executive-level conversations across complex organizations. She is comfortable presenting, writing, and speaking when the context calls for it.`,

  startupVsEnterprise: `She does her best building work in environments that move with urgency and care about quality simultaneously. Startups at the 0 to 1 stage are where she has built the most. She understands enterprise stakeholder dynamics from 17 years of operating inside large regulated organizations. She is fluent in both and can move between them naturally.`,

  notHealthcareOnly: `She is not a healthcare PM who learned AI. She is an AI product leader who has shipped across healthcare, fintech, enterprise conversational AI, consumer brand, creative tech, and workforce technology. ClearChannel and FinanceLens are financial services. AuthorFlow is publishing. Two Peaks is consumer ecommerce. LaidOffRise is workforce tech. The healthcare background is the deepest vertical but it is one of six, not the whole story.`,
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const profile = {
  name: "Hannah Kraulik Pagade",
  title: "AI product leader across product management and UX design",
  location: "Westminster, CO",
  openToRelocation: true,
  preferredLocations: ["San Francisco, CA", "Remote"],
  email: "hannah.pagade@gmail.com",
  portfolio: "https://hannahkraulikpagade.com",
  linkedin: "https://www.linkedin.com/in/hannah-pagade",
  github: "https://github.com/rohimayaventures",
  currentRole: "Licensed Practical Nurse at PAM Health Rehabilitation Hospital of Westminster, CO",
  education: {
    degree: "MS, Artificial Intelligence and Machine Learning",
    school: "University of Colorado Boulder",
    status: "In progress",
    expected: "2026",
    relevantCoursework: [
      "Natural Language Processing",
      "Human-Computer Interaction",
      "Machine Learning",
      "AI Ethics",
      "Research Methods",
    ],
  },
  certifications: [
    "Google UX Design Professional Certificate (2025)",
    "Microsoft AI Product Manager Certificate (2025)",
    "Enterprise Product Management Fundamentals (2025)",
    "LPN Nursing License (2009)",
  ],
  summary: `Hannah builds AI products that ship across product management and UX design. She owns strategy, priorities, and rollout on one side and flows, trust, and AI behavior in the product on the other. She has shipped live products across healthcare, fintech, enterprise conversational AI, consumer, creative tech, and workforce technology. The breadth is the point. She came from 17 years of operating in environments where getting it wrong had real consequences, and that shaped a product instinct most candidates cannot develop from a whiteboard.`,

  positioning: `I build AI products that actually ship, and I work across the whole thing. I am not a healthcare PM who learned AI. I am an AI product leader who has the deepest possible domain expertise in one vertical and has applied the same instincts across six others.`,

  background: {
    yearsExperience: 17,
    summary: `17 years of experience spanning roles in pediatric home health, travel assignments across multiple care settings, skilled nursing, post-acute rehabilitation, and senior living. From bedside roles through director-level leadership of 130 or more people. The setting is the context. The leadership, product, and people skills are the transferable asset.`,
    leadershipDepth: `Deep experience recruiting and hiring for roles where judgment under pressure mattered more than credentials. Built and ran onboarding programs that reduced time-to-competency in complex workflows. Managed performance and retention in environments where staff leaving had real downstream consequences. Led teams through technology adoption under resistance, one of the hardest change management problems in any organization. Operated without direct authority and influenced outcomes through credibility and stakeholder alignment. That is exactly how a PM works.`,
    rcmFluency: `Deep fluency in payer documentation, prior authorization, claims processing, denial management, and billing operations. OrixLink AI's Stripe architecture with idempotent billing, atomic credit delivery, and unique constraint-based deduplication reflects payment systems thinking built from real operational experience.`,
  },

  targetRoles: [
    "AI Product Manager",
    "Head of Product",
    "Conversational AI Designer",
    "Conversational UX Strategist",
    "Founding PM",
    "Senior AI Product Design",
    "Healthcare AI Product Lead",
  ],

  compensation: `Hannah prefers to have that conversation once there is mutual fit on both sides. Reach her through the contact page at hannahkraulikpagade.com.`,

  availability: `Two weeks from the time of offer. If there is a specific date in mind, reach out through the contact page and Hannah can work through that together with you.`,
};

// ─── METRICS ─────────────────────────────────────────────────────────────────

export const metrics = {
  operations: [
    { metric: "$1.2M cost savings", context: "Evidence-based workflow analysis and process optimization", employer: "Amberwood Post Acute Rehabilitation", role: "Assistant Director of Clinical Operations", dates: "Nov 2023 to Sept 2024" },
    { metric: "Satisfaction improved from 72% to 87%", context: "Research-driven operational redesign", employer: "Senior Living Facility", role: "Director of Clinical Operations", dates: "May 2025 to July 2025" },
    { metric: "96% regulatory audit success rate", context: "Maintained across a HIPAA-regulated environment", employer: "Senior Living Facility", role: "Director of Clinical Operations", dates: "May 2025 to July 2025" },
    { metric: "25% reduction in operational friction", context: "Journey mapping and process redesign", employer: "Center at Northridge", role: "Unit Director of Clinical Operations", dates: "Oct 2024 to April 2025" },
    { metric: "130+ people led", context: "Cross-functional team management in a HIPAA-regulated environment", employer: "Amberwood Post Acute Rehabilitation", dates: "Nov 2023 to Sept 2024" },
  ],
  product: [
    { metric: "85% conversion from skeptic to committed pilot partner", context: "AI adoption research with structured demonstration frameworks (n=12 executives)" },
    { metric: "Conversational intake reduced from 7 turns to 3", context: "Metric-driven product decision preserving completeness while improving engagement", product: "OrixLink AI" },
    { metric: "OrixLink AI shipped in under 90 days", context: "From concept to live monetized product. Sole PM, designer, and implementation lead.", product: "OrixLink AI" },
    { metric: "March 2026 clinical validation", context: "OrixLink flagged a compartment syndrome presentation as a red-flag emergency. Assessment matched the clinical workup.", product: "OrixLink AI" },
    { metric: "25 stakeholder interviews", context: "Primary UX research informing conversation design and information architecture", product: "OrixLink AI" },
    { metric: "7 structured scenario validation tests", context: "Escalation interaction pattern validated across high-acuity presentations", product: "OrixLink AI" },
  ],
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export const projects = [
  {
    slug: "orixlink-ai",
    name: "OrixLink AI",
    domain: "Healthcare AI",
    tagline: "Where every symptom finds its answer.",
    status: "live",
    liveUrl: "https://triage.rohimaya.ai",
    caseStudyUrl: "https://hannahkraulikpagade.com/work/orixlink-ai",
    tags: ["CLINICAL-AI", "CONVERSATIONAL", "FULL-STACK", "MONETIZED"],
    role: "Product Lead, Conversation UX, Prompt Architect, Full-Stack Implementation",
    timeline: "2025 to present",
    summary: "Universal clinical triage and conversational assessment. Any symptom, any person, no prior diagnosis required. Structured differential, red flag criteria, four-tier urgency, follow-up chat, compliance-oriented disclosures. Live commercial pilot with tiered Stripe subscriptions.",
    stack: { highlighted: ["Next.js 16", "Claude API (Sonnet/Haiku)", "Supabase", "Stripe", "Vercel"], standard: ["TypeScript", "Tailwind CSS v4", "Resend", "Google OAuth", "Zod"] },
    designSystem: "Meridian Oracle (Obsidian #080C14, Gold #C8A96E, Cream #F4EFE6, Cormorant Garamond, DM Sans, DM Mono)",
    proofPoint: "Seven days after Hannah's spouse had a radial artery cardiac catheterization with stent placement, he developed forearm swelling and progressive grip weakness. OrixLink flagged compartment syndrome as a red-flag emergency and recommended going to the ER immediately. He was seen. The assessment matched the clinical workup.",
    keyOutcome: "Live commercial pilot. Stripe subscriptions, credit packs, Google OAuth, atomic usage caps with rollback, idempotent credit webhooks. March 2026 validation matched clinical workup on a compartment syndrome presentation.",
  },
  {
    slug: "healthliteracy-ai",
    name: "HealthLiteracy AI",
    domain: "Healthcare AI / Patient Facing",
    tagline: "Medical documents in plain language for every patient.",
    status: "live",
    liveUrl: "https://literacy.rohimaya.ai",
    caseStudyUrl: "https://hannahkraulikpagade.com/work/healthliteracy-ai",
    tags: ["CLINICAL-AI", "PATIENT-FACING", "FULL-STACK", "ACCESSIBILITY"],
    role: "Product Lead, Prompt Architect, Full-Stack Implementation",
    timeline: "2025",
    summary: "Free patient-facing tool translating clinical documents into plain language at three reading levels across 12 languages. Two-pass AI verification checks translation completeness before it reaches the user.",
    stack: { highlighted: ["Next.js 15", "Claude API", "Supabase", "Vercel"], standard: ["TypeScript", "Tailwind CSS", "pdf-parse", "Web Speech API", "Zod"] },
    designSystem: "Candlelight Clarity (Forest Green #0F3D34, Amber #D4882A, Cream #F4EFE6)",
    keyOutcome: "Live free tool. Three reading levels, 12 languages, voice input, two-pass AI verification, shareable URLs.",
  },
  {
    slug: "clearchannel-vestara",
    name: "ClearChannel by Vestara",
    domain: "Enterprise Conversational AI / Fintech",
    tagline: "Design the conversation. Across every channel.",
    status: "live",
    liveUrl: "https://clearchannel-vestara.vercel.app",
    caseStudyUrl: "https://hannahkraulikpagade.com/work/clearchannel-vestara",
    tags: ["CONVERSATION-DESIGN", "IVR", "NLU", "FINTECH", "VOICE-AI", "ENTERPRISE"],
    role: "Conversation Design Lead, Prompt Architect, Full-Stack Implementation",
    timeline: "March 2026",
    summary: "Enterprise NLU routing simulator for a fictional financial services contact center. One utterance produces simultaneous IVR, chatbot, and agent assist outputs via SSE streaming. Five sentiment states drive a full UI retheme. Three critical overrides fire before general intent classification: bereavement, fraud, barge-in. Not healthcare. Pure enterprise conversational AI and financial services UX.",
    stack: { highlighted: ["Next.js 15", "Claude API", "OpenAI Whisper STT", "OpenAI TTS", "Vercel"], standard: ["TypeScript", "Tailwind CSS v4", "SSE streaming", "React 19"] },
    designSystem: "Vestara Institutional — five sentiment-driven themes via data-sentiment CSS tokens: neutral teal, concerned amber, distressed purple, urgent red, confused blue",
    keyOutcome: "Live conversational design lab. Three-channel simultaneous output, emotional sensitivity overrides, compliance flag detection, full NLU intent taxonomy across 18 intents.",
  },
  {
    slug: "financelens-ai",
    name: "FinanceLens AI",
    domain: "Fintech / Investor Relations",
    tagline: "Financial documents in plain English.",
    status: "live",
    liveUrl: "https://financelens-ai.vercel.app",
    caseStudyUrl: "https://hannahkraulikpagade.com/work/financelens-ai",
    tags: ["FINTECH", "AI-PRODUCT", "FULL-STACK", "DOCUMENT-INTELLIGENCE"],
    role: "Product Lead, Prompt Architect, Full-Stack Implementation",
    timeline: "2026",
    summary: "Financial document intelligence for earnings calls, 10-K filings, and regulatory notices. Six structured output sections, language drift detection, evidence-based confidence rubric, compare mode, branded PDF export, PPTX briefing deck generation, and 30-day shareable deck URLs. Not healthcare. Pure fintech and investor relations.",
    stack: { highlighted: ["Next.js 16", "React 19", "Claude API", "Supabase", "Vercel"], standard: ["TypeScript", "Tailwind CSS v4", "pdf-lib", "pptxgenjs", "Zod"] },
    designSystem: "WSJ Editorial (Warm Cream, Fraunces on landing, Georgia in app, IBM Plex Mono for data)",
    keyOutcome: "Live tool. PDF export, PPTX deck generation, document comparison, language drift detection, 30-day shareable deck URLs.",
  },
  {
    slug: "laidoffrise-mcp",
    name: "LaidOffRise MCP Server",
    domain: "Workforce Technology / Agentic AI",
    tagline: "The AI job search brain. Eight tools. Zero cognitive load.",
    status: "building",
    liveUrl: null,
    caseStudyUrl: null,
    tags: ["MCP", "AGENTIC-AI", "JOB-SEARCH", "WORKFORCE-TECH"],
    role: "Product Lead, MCP Architect, Full-Stack Implementation",
    timeline: "April 2026",
    summary: "An MCP server giving any Claude-compatible AI the ability to run a complete job search workflow. Eight tools: search live jobs across six legitimate sources, score fit against a candidate profile, assess skill gaps with specific learning resources, build ATS-optimized resumes with two-pass AI verification, generate tailored cover letters, produce daily action plans capped at three tasks, and generate full interview prep packs. Not healthcare. Workforce technology.",
    stack: { highlighted: ["TypeScript", "MCP SDK", "Express", "Zod", "Anthropic SDK"], standard: ["Railway", "Greenhouse API", "RemoteOK", "Adzuna", "SerpApi", "USAJobs"] },
    keyOutcome: "In active development. Demonstrates agentic tool design, multi-source job routing, anti-hallucination resume architecture, and product philosophy where AI carries cognitive load.",
  },
  {
    slug: "ask-hannah-mcp",
    name: "Ask Hannah MCP Server",
    domain: "Developer Tooling / Portfolio Technology",
    tagline: "An interactive portfolio that lives inside your AI tools.",
    status: "building",
    liveUrl: null,
    caseStudyUrl: null,
    tags: ["MCP", "PORTFOLIO", "INTERACTIVE", "DEVELOPER-TOOLING"],
    role: "Product Lead, MCP Architect, Full-Stack Implementation",
    timeline: "April 2026",
    summary: "A publicly shareable MCP server that lets any recruiter or hiring manager add a URL to their Claude and query Hannah's work, background, metrics, projects, and generate tailored resumes and cover letters in natural language. Seven structured tools. The same data powers the portfolio widget at hannahkraulikpagade.com.",
    stack: { highlighted: ["TypeScript", "MCP SDK", "Express", "Zod", "Railway"], standard: ["Anthropic SDK"] },
    keyOutcome: "In active development. Demonstrates MCP protocol fluency, structured data tool design, and a genuinely novel job search leave-behind strategy.",
  },
];

// ─── SKILLS ──────────────────────────────────────────────────────────────────

export const skills = {
  product: [
    "0-to-1 Product Development and MVP Scoping",
    "AI Product Strategy",
    "Conversation Design",
    "IVR and Chatbot Design",
    "Agent Assist UX",
    "Intent Architecture and NLU Model Development",
    "Prompt Engineering",
    "Multi-Turn Dialogue Systems",
    "Role-Adaptive Conversation Design",
    "Escalation Interaction Design",
    "AI Safety and Guardrails Design",
    "Human-in-the-Loop System Design",
    "Evaluation Frameworks and Success Metrics",
    "Discovery and User Research",
    "Contextual Inquiry and Stakeholder Interviews",
    "Usability Testing and SUS Scoring",
    "Outcome-Driven Roadmapping",
    "Cross-Functional Leadership Without Authority",
    "Change Management",
    "Recruiting, Hiring, and Team Development",
    "Onboarding Program Design",
    "Performance Management in High-Stakes Environments",
    "Executive Stakeholder Alignment and C-Suite Communication",
  ],
  technical: [
    "Next.js (14, 15, 16 App Router)",
    "TypeScript",
    "Tailwind CSS including v4",
    "React including React 19",
    "Claude API (Anthropic)",
    "OpenAI APIs (Whisper STT, TTS, Realtime API, DALL-E)",
    "ElevenLabs voice cloning and TTS",
    "FastAPI and Python 3.11+",
    "Supabase (PostgreSQL, RLS, Auth, Storage, pg_cron)",
    "Stripe (subscriptions, webhooks, idempotent billing)",
    "Vercel and Railway",
    "Cloudflare R2 and DNS",
    "MCP SDK",
    "Zod schema validation",
    "pdf-lib and pptxgenjs",
    "SSE streaming",
    "Shopify",
    "Google Drive OAuth",
    "Web Speech API",
    "Figma",
    "Cursor",
    "Git",
  ],
  domain: [
    "Enterprise financial services NLU and contact center design",
    "Financial document intelligence and language drift detection",
    "Subscription billing architecture and revenue operations",
    "Consumer brand and ecommerce",
    "Audiobook and publishing pipeline",
    "Workforce technology and job search systems",
    "HIPAA-compliant system design",
    "Payer and provider workflow dynamics",
    "Prior authorization and revenue cycle operations",
    "Post-acute rehabilitation care",
    "Senior living and skilled nursing operations",
    "Pediatric home health",
    "Multi-site regulated environment operations",
  ],
};

// ─── DESIGN SYSTEMS ───────────────────────────────────────────────────────────

export const designSystems = [
  { name: "Meridian Oracle", product: "OrixLink AI", colors: "Obsidian #080C14, Gold #C8A96E, Cream #F4EFE6", fonts: "Cormorant Garamond, DM Sans, DM Mono" },
  { name: "Candlelight Clarity", product: "HealthLiteracy AI", colors: "Forest Green #0F3D34, Amber #D4882A, Cream #F4EFE6", fonts: "Same as Meridian Oracle" },
  { name: "Vestara Institutional", product: "ClearChannel by Vestara", colors: "Five sentiment-driven themes via data-sentiment CSS tokens", fonts: "IBM Plex Sans, IBM Plex Mono" },
  { name: "WSJ Editorial", product: "FinanceLens AI", colors: "Warm Cream, Deep Ink, Signal Red", fonts: "Fraunces (landing), Georgia (app), IBM Plex Mono (data)" },
];
