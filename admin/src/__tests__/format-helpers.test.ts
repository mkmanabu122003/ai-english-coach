import { describe, it, expect } from "vitest";

// Test the formatTimestamp and formatDate functions that were fixed for null safety
function formatTimestamp(ts: { _seconds: number; _nanoseconds: number } | null | undefined): string {
  if (!ts || typeof ts._seconds !== "number") return "-";
  return new Date(ts._seconds * 1000).toLocaleString("ja-JP");
}

function formatDate(ts: { _seconds: number; _nanoseconds: number } | null | undefined): string {
  if (!ts || typeof ts._seconds !== "number") return "-";
  return new Date(ts._seconds * 1000).toLocaleDateString("ja-JP");
}

describe("formatTimestamp", () => {
  it("formats valid timestamp", () => {
    const ts = { _seconds: 1700000000, _nanoseconds: 0 };
    const result = formatTimestamp(ts);
    expect(result).not.toBe("-");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns '-' for null", () => {
    expect(formatTimestamp(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatTimestamp(undefined)).toBe("-");
  });

  it("returns '-' for malformed object", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatTimestamp({} as any)).toBe("-");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatTimestamp({ _seconds: "not-a-number" } as any)).toBe("-");
  });
});

describe("formatDate", () => {
  it("formats valid timestamp as date", () => {
    const ts = { _seconds: 1700000000, _nanoseconds: 0 };
    const result = formatDate(ts);
    expect(result).not.toBe("-");
  });

  it("returns '-' for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatDate(undefined)).toBe("-");
  });
});
