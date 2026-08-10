import type { ReactNode } from "react";
import {
  approvalLabels,
  operationLabels,
  orderStatusLabels,
  paymentStatusLabels,
  reviewVisibilityLabels,
  roleLabels,
  userStatusLabels,
} from "../lib/format";
import type {
  ApprovalStatus,
  OperationStatus,
  OrderStatus,
  PaymentStatus,
  ReviewVisibility,
  UserRole,
  UserStatus,
} from "../types";

const tones: Record<string, string> = {
  active: "success", approved: "success", open: "success", delivered: "success", paid: "success", visible: "success",
  pending: "warning", pending_verification: "warning", confirmed: "info", preparing: "info", delivering: "purple", flagged: "warning",
  rejected: "danger", locked: "danger", suspended: "danger", cancelled: "danger", failed: "danger",
  temporarily_closed: "neutral", unpaid: "neutral", refunded: "neutral", hidden: "neutral", customer: "neutral",
  restaurant_owner: "info", admin: "purple",
};

export function Badge({ value, children }: { value: string; children: ReactNode }) {
  return <span className={`badge badge-${tones[value] ?? "neutral"}`}><i />{children}</span>;
}

export const ApprovalBadge = ({ value }: { value: ApprovalStatus }) => <Badge value={value}>{approvalLabels[value]}</Badge>;
export const OperationBadge = ({ value }: { value: OperationStatus }) => <Badge value={value}>{operationLabels[value]}</Badge>;
export const OrderBadge = ({ value }: { value: OrderStatus }) => <Badge value={value}>{orderStatusLabels[value]}</Badge>;
export const PaymentBadge = ({ value }: { value: PaymentStatus }) => <Badge value={value}>{paymentStatusLabels[value]}</Badge>;
export const UserStatusBadge = ({ value }: { value: UserStatus }) => <Badge value={value}>{userStatusLabels[value]}</Badge>;
export const RoleBadge = ({ value }: { value: UserRole }) => <Badge value={value}>{roleLabels[value]}</Badge>;
export const ReviewBadge = ({ value }: { value: ReviewVisibility }) => <Badge value={value}>{reviewVisibilityLabels[value]}</Badge>;
