import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApprovalBadge, OrderBadge, UserStatusBadge } from "./StatusBadge";

describe("status badges", () => {
  it("renders explicit text in addition to status color", () => {
    render(<><ApprovalBadge value="pending" /><OrderBadge value="delivered" /><UserStatusBadge value="locked" /></>);
    expect(screen.getByText("Chờ duyệt")).toBeInTheDocument();
    expect(screen.getByText("Hoàn tất")).toBeInTheDocument();
    expect(screen.getByText("Đã khóa")).toBeInTheDocument();
  });
});
