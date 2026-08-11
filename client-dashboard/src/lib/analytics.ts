import { formatDate, formatNumber } from "./format";

export type AnalyticsGranularity = "day" | "month" | "year";

const dateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function analyticsRange(granularity: AnalyticsGranularity, now = new Date()) {
  const to = new Date(now);
  const from = new Date(now);
  if (granularity === "day") from.setDate(from.getDate() - 29);
  if (granularity === "month") { from.setDate(1); from.setMonth(from.getMonth() - 11); }
  if (granularity === "year") { from.setMonth(0, 1); from.setFullYear(from.getFullYear() - 4); }
  return { from: dateInputValue(from), to: dateInputValue(to) };
}

export function formatAnalyticsPeriod(period: string, granularity: AnalyticsGranularity) {
  if (granularity === "year") return period;
  if (granularity === "month") return `T${period.slice(5, 7)}/${period.slice(0, 4)}`;
  return formatDate(period);
}

export function formatCompactMoney(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 0 : 1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)} tr`;
  return formatNumber(Math.round(value));
}
