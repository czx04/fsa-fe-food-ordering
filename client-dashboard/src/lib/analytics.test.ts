import { describe, expect, it } from "vitest";
import { analyticsRange, formatAnalyticsPeriod, formatCompactMoney } from "./analytics";

describe("analytics helpers", () => {
  const now = new Date(2026, 7, 10, 12, 0, 0);

  it("builds useful default ranges for each granularity", () => {
    expect(analyticsRange("day", now)).toEqual({ from: "2026-07-12", to: "2026-08-10" });
    expect(analyticsRange("month", now)).toEqual({ from: "2025-09-01", to: "2026-08-10" });
    expect(analyticsRange("year", now)).toEqual({ from: "2022-01-01", to: "2026-08-10" });
  });

  it("formats period labels and compact money", () => {
    expect(formatAnalyticsPeriod("2026-08", "month")).toBe("T08/2026");
    expect(formatAnalyticsPeriod("2026", "year")).toBe("2026");
    expect(formatCompactMoney(2_500_000)).toBe("2.5 tr");
    expect(formatCompactMoney(12_000_000_000)).toBe("12 tỷ");
  });
});
