import type { Request, Response, NextFunction } from "express";

const buckets = new Map<string, number[]>();

function clientKey(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0]!.trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function rateLimitEnabled(): boolean {
  const v = process.env.MCP_RATE_LIMIT_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Optional sliding-window limiter for POST /mcp (all tools). Off unless MCP_RATE_LIMIT_ENABLED is set. */
export function mcpPostRateLimiter() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!rateLimitEnabled()) {
      next();
      return;
    }
    const max = Math.max(1, parseInt(process.env.MCP_RATE_LIMIT_MAX ?? "120", 10));
    const windowMs = Math.max(1000, parseInt(process.env.MCP_RATE_LIMIT_WINDOW_MS ?? "60000", 10));
    const now = Date.now();
    const key = clientKey(req);
    const prev = buckets.get(key) ?? [];
    const pruned = prev.filter((t) => now - t < windowMs);
    if (pruned.length >= max) {
      res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
      res.status(429).json({
        error: "rate_limited",
        message: "Too many MCP requests from this client. Try again shortly.",
      });
      return;
    }
    pruned.push(now);
    buckets.set(key, pruned);
    next();
  };
}
