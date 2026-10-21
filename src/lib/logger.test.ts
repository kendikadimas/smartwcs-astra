import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { Writable } from "node:stream";
import pino from "pino";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  process.env.DATABASE_URL = "postgresql://wcs:wcs@localhost:5432/smartwcs";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function collectingStream() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return { stream, chunks };
}

describe("logger", () => {
  it("meredaksi field sensitif tapi membiarkan field biasa", async () => {
    const { loggerOptions } = await import("./logger");
    const { stream, chunks } = collectingStream();
    const testLogger = pino(loggerOptions, stream);

    testLogger.info(
      {
        authorization: "Bearer super-secret-token",
        signature: "sig-abc",
        apiAppSecret: "app-secret-xyz",
        password: "p4ssw0rd",
        token: "tok-123",
        callbackCode: "cb-code-xyz",
        username: "alya",
      },
      "test log entry",
    );

    const output = chunks.join("");
    expect(output).not.toContain("super-secret-token");
    expect(output).not.toContain("sig-abc");
    expect(output).not.toContain("app-secret-xyz");
    expect(output).not.toContain("p4ssw0rd");
    expect(output).not.toContain("tok-123");
    expect(output).not.toContain("cb-code-xyz");
    expect(output).toContain("[REDACTED]");
    expect(output).toContain("alya");
  });

  it("meredaksi field sensitif satu level di dalam objek nested", async () => {
    const { loggerOptions } = await import("./logger");
    const { stream, chunks } = collectingStream();
    const testLogger = pino(loggerOptions, stream);

    testLogger.info(
      { headers: { authorization: "Bearer nested-secret" } },
      "nested test",
    );

    const output = chunks.join("");
    expect(output).not.toContain("nested-secret");
  });
});
