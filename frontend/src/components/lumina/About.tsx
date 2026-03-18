import { Brain, Sparkles, Heart, Sun, Focus, Wind, AlertTriangle, Shuffle, Minus } from 'lucide-react';

const features = [
  { title: 'Understand', desc: 'Analyzes journal text + contextual signals to predict emotional state', icon: Brain, color: 'text-primary' },
  { title: 'Decide', desc: 'Rule-based decision engine recommends personalized actions and timing', icon: Sparkles, color: 'text-secondary' },
  { title: 'Guide', desc: 'Generates supportive messages to help you move toward a better mental state', icon: Heart, color: 'text-success' },
];

const states = [
  { name: 'Calm', desc: 'A peaceful, settled state of mind', icon: Sun, color: 'text-state-calm', rec: 'Continue mindful observation' },
  { name: 'Focused', desc: 'Clear-headed and present in the moment', icon: Focus, color: 'text-state-focused', rec: 'Deep work session' },
  { name: 'Restless', desc: 'Agitated or unable to settle down', icon: Wind, color: 'text-state-restless', rec: 'Box breathing exercise' },
  { name: 'Overwhelmed', desc: 'Feeling flooded by emotions or thoughts', icon: AlertTriangle, color: 'text-state-overwhelmed', rec: 'Grounding technique' },
  { name: 'Mixed', desc: 'A complex blend of multiple emotions', icon: Shuffle, color: 'text-state-mixed', rec: 'Journaling session' },
  { name: 'Neutral', desc: 'A balanced, baseline emotional state', icon: Minus, color: 'text-state-neutral', rec: 'Gentle exploration' },
];

const techBadges = ['Python', 'FastAPI', 'XGBoost', 'Sentence-BERT', 'React', 'Tailwind CSS'];

export function About() {
  return (
    <div className="space-y-12 max-w-4xl">
      {/* Hero */}
      <div className="text-center py-8">
        <span className="text-5xl text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)] block mb-4">✦</span>
        <h2 className="text-3xl font-bold text-foreground">Lumina</h2>
        <p className="text-sm text-muted-foreground mt-1">Emotional Intelligence System</p>
        <p className="text-sm text-muted-foreground/80 mt-4 max-w-md mx-auto leading-relaxed">
          Lumina analyzes your journal reflections and contextual signals using machine learning to predict your emotional state, 
          provide actionable recommendations, and support your mental wellness journey.
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="glass-card p-6 text-center space-y-3">
            <f.icon size={28} className={`${f.color} mx-auto`} />
            <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* States */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">Emotional States</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {states.map((s) => (
            <div key={s.name} className="glass-card p-4 space-y-2">
              <s.icon size={20} className={s.color} />
              <h4 className="text-sm font-semibold text-foreground">{s.name}</h4>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s.rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-3">How Confidence Works</h3>
        <div className="glass-card p-5 space-y-4">
          <p className="text-sm text-muted-foreground">The model outputs a confidence score (0-100%) indicating prediction certainty.</p>
          <div className="space-y-2">
            {[{ label: 'High (60%+)', color: 'bg-success', w: '82%' }, { label: 'Medium (40-60%)', color: 'bg-warning', w: '52%' }, { label: 'Low (<40%)', color: 'bg-destructive', w: '28%' }].map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28">{c.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: c.w }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-3">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {techBadges.map((t) => (
            <span key={t} className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground font-medium">{t}</span>
          ))}
        </div>
      </div>

      <div className="text-center py-6 border-t border-border">
        <p className="text-xs text-muted-foreground">Built for ArvyaX Machine Learning Internship · RevoltronX</p>
      </div>
    </div>
  );
}
