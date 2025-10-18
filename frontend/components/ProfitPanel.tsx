"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";

interface ProfitPoint {
  label: string;
  value: number;
}

interface ProfitPanelProps {
  data: ProfitPoint[];
}

export function ProfitPanel({ data }: ProfitPanelProps) {
  const totalProfit = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-borderLight bg-gradient-to-br from-surface/80 to-surfaceLight/60 backdrop-blur-xl p-6 shadow-card">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <header className="relative flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-secondary" />
            <h3 className="font-display text-xl font-bold text-textPrimary">Profit Analytics</h3>
          </div>
          <p className="text-sm text-textMuted">Merchant earnings overview</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            {totalProfit.toFixed(4)} Ξ
          </div>
          <p className="text-xs text-textMuted">Total Earnings</p>
        </div>
      </header>
      
      <div className="relative h-64 rounded-xl bg-background/30 border border-borderLight p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" opacity={0.12} />
            <XAxis 
              dataKey="label" 
              stroke="#B8A56C" 
              tickLine={false} 
              axisLine={false}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#B8A56C" 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val: number) => `${val.toFixed(2)}Ξ`}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(19, 25, 41, 0.95)', 
                border: '1px solid #374151',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
              labelStyle={{ color: '#F9FAFB' }}
              itemStyle={{ color: '#D4AF37' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#D4AF37" 
              strokeWidth={3} 
              fill="url(#colorProfit)"
              dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
