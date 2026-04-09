import type Anthropic from "@anthropic-ai/sdk";

export type MessageCreateParams = Parameters<Anthropic["messages"]["create"]>[0];

export function getAnthropicErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status?: unknown }).status;
    if (typeof s === "number" && Number.isFinite(s)) return s;
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown): boolean {
  const status = getAnthropicErrorStatus(err);
  if (status === 429 || status === 408 || status === 503 || status === 529) return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnreset") ||
    msg.includes("socket hang up") ||
    msg.includes("overloaded")
  );
}

export async function messagesCreateWithRetry(
  anthropic: Anthropic,
  params: MessageCreateParams,
  options?: { maxAttempts?: number; baseDelayMs?: number }
): Promise<{ response: Anthropic.Message; attempts: number }> {
  const maxAttempts = Math.min(
    10,
    Math.max(1, parseInt(process.env.ANTHROPIC_RETRY_MAX_ATTEMPTS ?? "3", 10))
  );
  const baseDelayMs = Math.max(50, parseInt(process.env.ANTHROPIC_RETRY_BASE_MS ?? "1000", 10));
  const attemptsCap = options?.maxAttempts ?? maxAttempts;
  const delayBase = options?.baseDelayMs ?? baseDelayMs;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= attemptsCap; attempt++) {
    try {
      const raw = await anthropic.messages.create(params);
      const response = raw as Anthropic.Message;
      return { response, attempts: attempt };
    } catch (err) {
      lastErr = err;
      if (attempt >= attemptsCap || !isRetryableError(err)) {
        throw err;
      }
      const delay = delayBase * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }
  throw lastErr;
}
