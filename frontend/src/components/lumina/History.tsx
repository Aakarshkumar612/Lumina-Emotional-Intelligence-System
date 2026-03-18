import { useState } from 'react';
import { BarChart3, Brain, TrendingUp, AlertTriangle, PenLine, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import type { PredictionResult } from '@/api/emotionApi';

export interface HistoryEntry {
  id: string;
  result: PredictionResult;
  journalText: string;
  timestamp: string;
  formData: Record<string, any>;
}

const STATE_COLORS: Record<string, string> = {
  calm: '#10B981',
  focused: '#06B6D4',
  restless: '#F59E0B',
  overwhelmed: '#EF4444',
  mixed: '#7C3AED',
  neutral: '#64748B',
};

const STATE_TAILWIND: Record<string, string> = {
  calm: 'bg-state-calm text-white',
  focused: 'bg-state-focused text-white',
  restless: 'bg-state-restless text-white',
  overwhelmed: 'bg-state-overwhelmed text-white',
  mixed: 'bg-state-mixed text-white',
  neutral: 'bg-state-neutral text-white',
};

interface Props {
  history: HistoryEntry[];
  onNavigate: (page: 'session') => void;
}

export function History({ history, onNavigate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Session History</h2>
          <p className="text-sm text-muted-foreground mt-1">Track your emotional patterns over time</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <BarChart3 size={24} className="text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No sessions recorded yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Complete your first session to see your history</p>
          <button
            onClick={() => onNavigate('session')}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start New Session →
          </button>
        </div>
      </div>
    );
  }

  const totalSessions = history.length;
  const stateCounts: Record<string, number> = {};
  let totalConf = 0;
  let uncertainCount = 0;
  history.forEach((h) => {
    const s = h.result.predicted_state;
    stateCounts[s] = (stateCounts[s] || 0) + 1;
    totalConf += h.result.confidence;
    if (h.result.is_uncertain) uncertainCount++;
  });
  const mostCommon = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  const avgConf = Math.round((totalConf / totalSessions) * 100);

  const pieData = Object.entries(stateCounts).map(([name, value]) => ({ name, value }));
  const barData = history.slice(-10).map((h, i) => ({
    session: i + 1,
    intensity: h.result.intensity,
    state: h.result.predicted_state,
  }));

  const stats = [
    { label: 'Total Sessions', value: totalSessions, icon: BarChart3, color: 'text-primary', border: 'border-t-primary' },
    { label: 'Most Common', value: mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1), icon: Brain, color: `text-[${STATE_COLORS[mostCommon]}]`, border: `border-t-[${STATE_COLORS[mostCommon]}]` },
    { label: 'Avg Confidence', value: `${avgConf}%`, icon: TrendingUp, color: 'text-secondary', border: 'border-t-secondary' },
    { label: 'Uncertain', value: uncertainCount, icon: AlertTriangle, color: 'text-warning', border: 'border-t-warning' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Session History</h2>
        <p className="text-sm text-muted-foreground mt-1">Track your emotional patterns over time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`glass-card p-4 border-t-2 ${s.border}`} style={{ animationDelay: `${i * 80}ms` }}>
            <s.icon size={18} className={`${s.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions list */}
        <div className="lg:col-span-2 space-y-3">
          {history.map((entry) => {
            const expanded = expandedId === entry.id;
            const sc = entry.result.predicted_state;
            const confPct = Math.round(entry.result.confidence * 100);
            const dots = Array.from({ length: 5 }, (_, i) => i < entry.result.intensity);
            return (
              <div
                key={entry.id}
                className="glass-card overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : entry.id)}
              >
                <div className="flex">
                  <div className="w-1 rounded-l-xl" style={{ backgroundColor: STATE_COLORS[sc] || STATE_COLORS.neutral }} />
                  <div className="flex-1 p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATE_TAILWIND[sc] || STATE_TAILWIND.neutral}`}>
                        {sc}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleDateString()}</span>
                        {expanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-1">{entry.journalText}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {dots.map((f, i) => (
                          <span key={i} className={`text-[8px] ${f ? '' : 'opacity-20'}`} style={{ color: STATE_COLORS[sc] }}>●</span>
                        ))}
                      </div>
                      <div className="flex-1 h-1 rounded-full bg-muted max-w-[80px] overflow-hidden">
                        <div className="h-full rounded-full bg-success" style={{ width: `${confPct}%` }} />
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{entry.result.what_to_do.replace(/_/g, ' ')}</span>
                    </div>

                    {expanded && (
                      <div className="pt-3 mt-3 border-t border-border space-y-3 animate-fade-in">
                        <p className="text-sm text-foreground/70">{entry.journalText}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(entry.formData).filter(([k]) => k !== 'journalText').map(([k, v]) => (
                            <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{k}: {String(v)}</span>
                          ))}
                        </div>
                        <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-3">{entry.result.supportive_message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Emotion Distribution</h3>
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATE_COLORS[entry.name] || STATE_COLORS.neutral} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                    formatter={(value: number) => [`${value} sessions`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{totalSessions}</p>
                  <p className="text-[10px] text-muted-foreground">sessions</p>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATE_COLORS[d.name] }} />
                  <span className="text-muted-foreground capitalize">{d.name}</span>
                  <span className="ml-auto text-foreground font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Intensity Over Time</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={barData}>
                <XAxis dataKey="session" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={STATE_COLORS[entry.state] || STATE_COLORS.neutral} />
                  ))}
                </Bar>
                <Tooltip
                  contentStyle={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
