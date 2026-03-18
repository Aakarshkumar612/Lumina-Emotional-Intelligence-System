import { Wind, Sun, Focus, AlertTriangle, Shuffle, Minus, Sparkles, BookmarkPlus, RefreshCw, HelpCircle, CheckCircle } from 'lucide-react';
import type { PredictionResult } from '@/api/emotionApi';

const stateConfig: Record<string, { color: string; icon: typeof Wind; label: string }> = {
  calm: { color: 'state-calm', icon: Sun, label: 'Calm' },
  focused: { color: 'state-focused', icon: Focus, label: 'Focused' },
  restless: { color: 'state-restless', icon: Wind, label: 'Restless' },
  overwhelmed: { color: 'state-overwhelmed', icon: AlertTriangle, label: 'Overwhelmed' },
  mixed: { color: 'state-mixed', icon: Shuffle, label: 'Mixed' },
  neutral: { color: 'state-neutral', icon: Minus, label: 'Neutral' },
};

interface ResultCardProps {
  result: PredictionResult;
  onSave: () => void;
  onNewSession: () => void;
}

export function ResultCard({ result, onSave, onNewSession }: ResultCardProps) {
  const config = stateConfig[result.predicted_state] || stateConfig.neutral;
  const StateIcon = config.icon;
  const confidencePct = Math.round(result.confidence * 100);
  const confColor = confidencePct < 40 ? 'bg-destructive' : confidencePct < 60 ? 'bg-warning' : 'bg-success';

  const dots = Array.from({ length: 5 }, (_, i) => i < result.intensity);

  return (
    <div className="animate-slide-in-result space-y-5">
      <div className="glass-card p-6 space-y-6">
        {/* Emotional State */}
        <div className="relative text-center py-6">
          <div className={`absolute inset-0 rounded-xl bg-${config.color}/10 blur-2xl`} />
          <div className="relative">
            <StateIcon size={40} className={`mx-auto mb-3 text-${config.color}`} />
            <h3 className={`text-3xl font-bold text-${config.color} animate-pulse-once`}>
              {config.label}
            </h3>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Intensity</span>
              <div className="flex gap-1">
                {dots.map((filled, i) => (
                  <span key={i} className={`text-sm ${filled ? `text-${config.color}` : 'text-muted-foreground/30'}`}>●</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HelpCircle size={12} />
              <span>Model Confidence</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{confidencePct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${confColor} animate-bar-fill`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <div>
            {result.is_uncertain ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                <AlertTriangle size={10} /> Uncertain Prediction
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                <CheckCircle size={10} /> High Confidence
              </span>
            )}
          </div>
        </div>

        {/* Recommendation */}
        <div className="glass-elevated rounded-lg p-4 border border-border space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles size={14} className="text-primary" />
            Recommended Action
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">What:</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-medium">
                {result.what_to_do.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">When:</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/15 text-secondary font-medium">
                {result.when_to_do}
              </span>
            </div>
          </div>
        </div>

        {/* Supportive Message */}
        <div className="relative border-l-4 border-primary/50 pl-4 py-3 rounded-r-lg bg-primary/5">
          <span className="absolute -left-0.5 -top-1 text-3xl text-primary/30 font-serif">"</span>
          <p className="text-sm italic text-muted-foreground leading-relaxed pt-3">
            {result.supportive_message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <BookmarkPlus size={15} /> Save to History
          </button>
          <button
            onClick={onNewSession}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <RefreshCw size={15} /> New Session
          </button>
        </div>
      </div>
    </div>
  );
}
