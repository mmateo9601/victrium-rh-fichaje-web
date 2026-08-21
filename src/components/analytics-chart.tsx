'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type ChartPoint = {
  label: string;
  value: number;
};

type AnalyticsChartProps = {
  title: string;
  description?: string;
  data: ChartPoint[];
  valueLabel?: string;
  emptyLabel?: string;
};

export function AnalyticsChart({ title, description, data, valueLabel = 'Tiempo', emptyLabel = 'Sin datos para mostrar' }: AnalyticsChartProps) {
  return (
    <section className="panel chart-panel stack">
      <div className="toolbar">
        <div className="stack" style={{ gap: '0.35rem' }}>
          <span className="eyebrow">Análisis</span>
          <div>
            <h2 className="section-title">{title}</h2>
            {description ? <p className="meta">{description}</p> : null}
          </div>
        </div>
      </div>

      {data.some((item) => item.value > 0) ? (
        <div className="chart-frame" aria-label={title}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="workGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.36} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(18, 32, 47, 0.08)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                width={42}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '1rem',
                  border: '1px solid rgba(18, 32, 47, 0.1)',
                  boxShadow: '0 16px 40px rgba(18, 32, 47, 0.08)'
                }}
                formatter={(value) => [
                  valueLabel === 'Horas' ? `${Math.round(Number(value))} h` : `${Math.round(Number(value))} ${valueLabel}`,
                  valueLabel
                ]}
              />
              <Area type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2.5} fill="url(#workGradient)" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state" role="status">
          <strong>{emptyLabel}</strong>
          <p className="meta">Cuando haya actividad suficiente, verás aquí la evolución de la semana.</p>
        </div>
      )}
    </section>
  );
}
