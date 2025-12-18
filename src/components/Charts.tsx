import {
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
}

export function BarChart({ data, title }: BarChartProps) {
  const chartData = data.map((item) => ({
    name: item.label,
    amount: item.value,
    color: item.color,
  }));

  return (
    <div className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsBarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
          <YAxis stroke="rgba(255,255,255,0.6)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#fff" }}
            formatter={(value) => `₹${Number(value).toFixed(2)}`}
          />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.8)" }} />
          <Bar
            dataKey="amount"
            name="Spending (₹)"
            fill="#8b5cf6"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartProps {
  data: ChartData[];
  title: string;
}

export function PieChart({ data, title }: PieChartProps) {
  const chartData = data.map((item) => ({
    name: item.label,
    value: Number(item.value.toFixed(2)),
    color: item.color,
  }));

  const COLORS = chartData.map((item) => item.color);

  return (
    <div className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8b5cf6"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#fff" }}
            itemStyle={{ color: "#fff" }}
            formatter={(value) => `₹${Number(value).toFixed(2)}`}
          />
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-sm font-semibold text-white">{item.name}</p>
              <p className="text-xs text-gray-400">₹{item.value.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
