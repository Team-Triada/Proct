'use client'

import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'

interface AttemptsPoint { day: string; count: number }
interface SubjectPoint  { code: string; count: number }

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 12,
        }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {payload[0].value} attempt{payload[0].value !== 1 ? 's' : ''}
            </p>
        </div>
    )
}

export function AttemptsChart({ data }: { data: AttemptsPoint[] }) {
    const max = Math.max(...data.map(d => d.count), 1)
    const todayIdx = data.length - 1

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(128,128,160,0.1)"
                    vertical={false}
                />
                <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                    domain={[0, max + 1]}
                    width={32}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(128,128,160,0.06)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {data.map((_, i) => (
                        <Cell
                            key={i}
                            fill={i === todayIdx ? '#e03e3e' : 'rgba(224,62,62,0.35)'}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

export function SubjectRanking({ data }: { data: SubjectPoint[] }) {
    if (data.length === 0) {
        return <p className="text-theme-muted text-sm py-4 text-center">No attempts recorded yet</p>
    }
    const max = data[0].count

    return (
        <div className="space-y-3">
            {data.map(s => (
                <div key={s.code} className="flex items-center gap-3">
                    <span
                        className="text-xs font-mono font-medium text-theme-muted shrink-0 text-right"
                        style={{ width: 56 }}
                    >
                        {s.code}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${Math.max(4, (s.count / max) * 100)}%`,
                                background: '#60a5fa',
                            }}
                        />
                    </div>
                    <span className="text-xs text-theme-muted shrink-0 tabular-nums" style={{ width: 28, textAlign: 'right' }}>
                        {s.count}
                    </span>
                </div>
            ))}
        </div>
    )
}
