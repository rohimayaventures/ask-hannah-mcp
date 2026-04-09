import test from "node:test";
import assert from "node:assert/strict";
import type Anthropic from "@anthropic-ai/sdk";
import { messagesCreateWithRetry } from "../lib/anthropic-retry.js";

test("messagesCreateWithRetry succeeds after retryable failures", async () => {
  let calls = 0;
  const anthropic = {
    messages: {
      create: async () => {
        calls += 1;
        if (calls < 3) {
          const err = new Error("rate limit") as Error & { status?: number };
          err.status = 429;
          throw err;
        }
        return {
          id: "msg_1",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "ok" }],
          model: "test",
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
        } as Anthropic.Message;
      },
    },
  } as unknown as Anthropic;

  const { response, attempts } = await messagesCreateWithRetry(
    anthropic,
    {
      model: "test",
      max_tokens: 8,
      stream: false,
      messages: [{ role: "user", content: "hi" }],
    },
    { maxAttempts: 5, baseDelayMs: 1 }
  );

  assert.equal(calls, 3);
  assert.equal(attempts, 3);
  assert.equal((response as Anthropic.Message).role, "assistant");
});

test("messagesCreateWithRetry does not retry non-retryable errors", async () => {
  let calls = 0;
  const anthropic = {
    messages: {
      create: async () => {
        calls += 1;
        const err = new Error("bad request") as Error & { status?: number };
        err.status = 400;
        throw err;
      },
    },
  } as unknown as Anthropic;

  await assert.rejects(
    () =>
      messagesCreateWithRetry(
        anthropic,
        {
          model: "test",
          max_tokens: 8,
          stream: false,
          messages: [{ role: "user", content: "hi" }],
        },
        { maxAttempts: 3, baseDelayMs: 1 }
      ),
    /bad request/
  );
  assert.equal(calls, 1);
});
