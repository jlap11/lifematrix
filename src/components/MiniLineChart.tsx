import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface MiniLineChartProps {
  readonly data: ReadonlyArray<{ month: string; value: number }>;
  readonly color?: string;
  readonly height?: number;
}

export function MiniLineChart({ data, color = '#8b5cf6', height = 60 }: MiniLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded" 
        style={{ height }}
      >
        <span className="text-xs text-muted-foreground">Sin datos</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, stroke: color, strokeWidth: 2, fill: 'white' }}
          />
          <Tooltip content={MiniTooltip as any} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function MiniTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">Score: {payload[0].value as number}</p>
      </div>
    );
  }
  return null;
}
