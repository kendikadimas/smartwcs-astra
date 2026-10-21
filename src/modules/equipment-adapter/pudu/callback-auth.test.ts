import { describe, expect, it } from "vitest";
import { verifyCallbackCode } from "./callback-auth";

describe("verifyCallbackCode", () => {
  it("true kalau cocok", () => {
    expect(verifyCallbackCode("secret-abc", "secret-abc")).toBe(true);
  });

  it("false kalau tidak cocok", () => {
    expect(verifyCallbackCode("secret-abc", "secret-xyz")).toBe(false);
  });

  it("false kalau panjang beda (tidak melempar error)", () => {
    expect(verifyCallbackCode("short", "much-longer-secret")).toBe(false);
  });

  it("false kalau header tidak ada", () => {
    expect(verifyCallbackCode(null, "secret-abc")).toBe(false);
  });
});
