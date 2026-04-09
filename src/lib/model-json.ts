/** Strip optional ``` / ```json fences from model output before JSON.parse. */
export function stripModelJsonFences(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/m, "").trim();
  }
  return t;
}
