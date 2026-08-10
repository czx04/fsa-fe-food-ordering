import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getErrorMessage,
  initials,
  orderStatusLabels,
  readEntityId,
} from "./format";

describe("dashboard format helpers", () => {
  it("formats VND without decimal digits", () => {
    const result = formatMoney(125000);
    expect(result).toContain("125.000");
    expect(result).toMatch(/₫|VND/);
  });

  it("formats dates in the Ho Chi Minh timezone", () => {
    expect(formatDate("2026-08-08T17:30:00.000Z")).toMatch(/09.?08.?2026/);
    expect(formatDateTime("2026-08-08T17:30:00.000Z")).toContain("00:30");
    expect(formatDate(null)).toBe("—");
  });

  it("keeps status labels centralized", () => {
    expect(orderStatusLabels.pending).toBe("Chờ xác nhận");
    expect(orderStatusLabels.delivered).toBe("Hoàn tất");
  });

  it("normalizes API errors and entity identifiers", () => {
    expect(getErrorMessage({ response: { data: { message: "Không có quyền" } } })).toBe("Không có quyền");
    expect(readEntityId("abc")).toBe("abc");
    expect(readEntityId({ _id: "xyz" })).toBe("xyz");
    expect(initials("Nguyễn Văn An")).toBe("VA");
  });
});
