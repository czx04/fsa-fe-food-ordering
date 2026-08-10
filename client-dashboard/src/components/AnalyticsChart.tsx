import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

export interface AnalyticsSeries {
  name: string;
  type: "area" | "line" | "bar";
  data: number[];
}

export default function AnalyticsChart({ options, series, height = 315 }: { options: ApexOptions; series: AnalyticsSeries[]; height?: number }) {
  return <Chart options={options} series={series} height={height} />;
}
