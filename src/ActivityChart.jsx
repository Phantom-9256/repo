import { motion } from "motion/react";
import { ChartNoAxesCombined } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#8d7ce8", "#55a8d5", "#50b58e"];

export default function ActivityChart({ data, total, reduceMotion }) {
  return (
    <motion.section
      className="activity-card"
      aria-labelledby="activity-title"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="activity-heading">
        <div className="activity-title-wrap">
          <span className="activity-icon"><ChartNoAxesCombined size={19} aria-hidden="true" /></span>
          <div>
            <h2 id="activity-title">Inbox by category</h2>
            <p>Active messages across your categories</p>
          </div>
        </div>
        <span className="activity-total">{total} total</span>
      </div>
      <div className="activity-chart" role="img" aria-label="Bar chart of active messages by category">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--chart-grid)", opacity: 0.55 }}
              contentStyle={{
                border: "1px solid var(--line)",
                borderRadius: 10,
                backgroundColor: "var(--surface)",
                color: "var(--text)",
                fontSize: 12,
              }}
              itemStyle={{ color: "var(--text)" }}
            />
            <Bar
              dataKey="messages"
              name="Messages"
              radius={[7, 7, 0, 0]}
              maxBarSize={56}
              animationDuration={reduceMotion ? 0 : 700}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
