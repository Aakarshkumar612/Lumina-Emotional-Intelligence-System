import { useState, useCallback } from 'react';
import { Leaf, Clock, Zap, Activity, Moon, Timer, Brain, Smile, Loader2 } from 'lucide-react';
import { ResultCard } from './ResultCard';
import { analyzeEmotion } from '@/api/emotionApi';
import type { PredictionResult } from '@/api/emotionApi';

interface FormData {
  journalText: string;
  ambienceType: string;
  timeOfDay: string;
  energyLevel: number;
  stressLevel: number;
  sleepHours: number;
  durationMin: number;
  previousMood: string;
  faceEmotionHint: string;
}

const defaultForm: FormData = {
  journalText: '',
  ambienceType: 'forest',
  timeOfDay: 'morning',
  energyLevel: 5,
  stressLevel: 5,
  sleepHours: 7,
  durationMin: 20,
  previousMood: 'none',
  faceEmotionHint: 'none',
};

interface Props {
  onResult: (result: PredictionResult, formData: FormData) => void;
  onNewSession: () => void;
  result: PredictionResult | null;
}

function SelectField({ label, icon: Icon, value, onChange, options }: {
  label: string; icon: typeof Leaf; value: string;
  onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon size={13} /> {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SliderField({ label, icon: Icon, value, onChange, min, max, colorFn }: {
  label: string; icon: typeof Zap; value: number; min: number; max: number;
  onChange: (v: number) => void; colorFn?: (v: number) => string;
}) {
  const color = colorFn ? colorFn(value) : 'bg-primary';
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon size={13} /> {label}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color} text-white`}>{value}</span>
      </label>
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-muted overflow-hidden pointer-events-none">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 appearance-none bg-transparent cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>Low</span><span>High</span>
      </div>
    </div>
  );
}

export function NewSession({ onResult, onNewSession, result }: Props) {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.journalText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyzeEmotion(form);
      onResult(res, form);
    } catch (err: any) {
      setError(err.message || 'Could not connect to Lumina API. Make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  }, [form, onResult]);

  const handleNewSession = useCallback(() => {
    setForm(defaultForm);
    setError(null);
    onNewSession();
  }, [onNewSession]);

  const stressColor = (v: number) => v <= 3 ? 'bg-success' : v <= 6 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">New Session</h2>
        <p className="text-sm text-muted-foreground mt-1">Record your reflection and receive personalized guidance</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — Form */}
        <div className="glass-card p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Your Reflection</h3>
            <div className="relative">
              <textarea
                value={form.journalText}
                onChange={(e) => updateForm('journalText', e.target.value.slice(0, 500))}
                placeholder="Describe how you felt during your session... What thoughts came up? How does your body feel right now?"
                className="w-full min-h-[128px] bg-background border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/60">
                {form.journalText.length} / 500
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Context Signals</h3>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Ambience" icon={Leaf} value={form.ambienceType}
                onChange={(v) => updateForm('ambienceType', v)}
                options={[
                  { value: 'forest', label: 'Forest' },
                  { value: 'ocean', label: 'Ocean' },
                  { value: 'rain', label: 'Rain' },
                  { value: 'mountain', label: 'Mountain' },
                  { value: 'café', label: 'Café' },
                ]}
              />
              <SelectField
                label="Time of Day" icon={Clock} value={form.timeOfDay}
                onChange={(v) => updateForm('timeOfDay', v)}
                options={[
                  { value: 'morning', label: 'Morning' },
                  { value: 'afternoon', label: 'Afternoon' },
                  { value: 'evening', label: 'Evening' },
                  { value: 'night', label: 'Night' },
                ]}
              />
              <SliderField label="Energy Level" icon={Zap} value={form.energyLevel} min={1} max={10} onChange={(v) => updateForm('energyLevel', v)} />
              <SliderField label="Stress Level" icon={Activity} value={form.stressLevel} min={1} max={10} onChange={(v) => updateForm('stressLevel', v)} colorFn={stressColor} />

              {/* Sleep */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Moon size={13} /> Sleep Hours
                </label>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateForm('sleepHours', Math.max(0, form.sleepHours - 0.5))}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >−</button>
                  <span className="flex-1 text-center text-sm font-medium text-foreground">{form.sleepHours}h</span>
                  <button
                    type="button"
                    onClick={() => updateForm('sleepHours', Math.min(12, form.sleepHours + 0.5))}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >+</button>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Timer size={13} /> Session Duration
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={form.durationMin}
                    onChange={(e) => updateForm('durationMin', Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
                </div>
              </div>

              <SelectField
                label="Previous Mood" icon={Brain} value={form.previousMood}
                onChange={(v) => updateForm('previousMood', v)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'calm', label: 'Calm' },
                  { value: 'focused', label: 'Focused' },
                  { value: 'mixed', label: 'Mixed' },
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'overwhelmed', label: 'Overwhelmed' },
                  { value: 'restless', label: 'Restless' },
                ]}
              />
              <SelectField
                label="Face Emotion Hint" icon={Smile} value={form.faceEmotionHint}
                onChange={(v) => updateForm('faceEmotionHint', v)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'calm_face', label: 'Calm' },
                  { value: 'happy_face', label: 'Happy' },
                  { value: 'sad_face', label: 'Sad' },
                  { value: 'tired_face', label: 'Tired' },
                  { value: 'angry_face', label: 'Angry' },
                  { value: 'neutral_face', label: 'Neutral' },
                  { value: 'surprised_face', label: 'Surprised' },
                ]}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
              <button onClick={handleSubmit} className="ml-2 underline font-medium">Retry</button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !form.journalText.trim()}
            className="relative w-full py-3 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-primary to-secondary overflow-hidden transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shimmer-hover"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Analyzing your state...
              </span>
            ) : (
              'Analyze My Emotional State →'
            )}
          </button>
        </div>

        {/* Right — Result */}
        <div>
          {result ? (
            <ResultCard result={result} onSave={() => {}} onNewSession={handleNewSession} />
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center">
              <span className="text-5xl text-primary/30 mb-4">✦</span>
              <p className="text-sm font-medium text-muted-foreground">Your analysis will appear here</p>
              <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-[240px]">
                Fill in your reflection and context signals to receive personalized emotional guidance
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
