import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

export interface AnalyticsSeries {
  name: string;
  type: "area" | "line" | "bar";
  data: number[];
}

export default function AnalyticsChart({ options, series, height = 315, type }: { options: ApexOptions; series: AnalyticsSeries[]; height?: number; type?: "area" | "line" | "bar" }) {
  return <Chart options={options} series={series} height={height} type={type} />;
}
