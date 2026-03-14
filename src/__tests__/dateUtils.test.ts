import { getYesterdayJST, getWeekId } from "../utils/dateUtils";

describe("getYesterdayJST", () => {
  it("should return previous day", () => {
    expect(getYesterdayJST("2026-03-14")).toBe("2026-03-13");
  });

  it("should handle month boundary", () => {
    expect(getYesterdayJST("2026-03-01")).toBe("2026-02-28");
  });

  it("should handle year boundary", () => {
    expect(getYesterdayJST("2026-01-01")).toBe("2025-12-31");
  });
});

describe("getWeekId", () => {
  it("should return ISO week format", () => {
    const result = getWeekId("2026-03-14");
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("should return consistent week for same week dates", () => {
    // Mon-Sun of the same week should have the same weekId
    const mon = getWeekId("2026-03-09");
    const fri = getWeekId("2026-03-13");
    expect(mon).toBe(fri);
  });
});
