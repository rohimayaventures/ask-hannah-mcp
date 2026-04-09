import { metricConfidenceNote, metricEvidenceTag } from "../lib/metrics.js";

export function handleGetMetrics(
  args: { category: "all" | "operations" | "product"; format: "markdown" | "json" },
  deps: { metrics: any; anonymizationNotice: string }
) {
  const { category, format } = args;
  const { metrics, anonymizationNotice } = deps;
  const opsMetrics = category === "product" ? [] : metrics.operations;
  const prodMetrics = category === "operations" ? [] : metrics.product;

  if (format === "json") {
    const operations = opsMetrics.map((m: any) => {
      const tag = metricEvidenceTag(m.metric, m.context);
      return {
        ...m,
        evidenceTag: tag,
        confidenceNote: metricConfidenceNote(tag),
      };
    });
    const product = prodMetrics.map((m: any) => {
      const tag = metricEvidenceTag(m.metric, m.context);
      return {
        ...m,
        evidenceTag: tag,
        confidenceNote: metricConfidenceNote(tag),
      };
    });
    const data = { operations, product, anonymizationNotice };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data };
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

  return { content: [{ type: "text" as const, text: md }] };
}
