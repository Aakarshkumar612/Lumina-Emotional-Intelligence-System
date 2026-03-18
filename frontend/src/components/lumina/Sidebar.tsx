import { LayoutDashboard, PenLine, Clock, Info } from 'lucide-react';

type Page = 'session' | 'history' | 'about';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'history', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'session', label: 'New Session', icon: PenLine },
  { id: 'about', label: 'About', icon: Info },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-16 lg:w-60 bg-card border-r border-border z-50 transition-all duration-200">
        {/* Logo */}
        <div className="p-4 lg:p-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xl text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]">✦</span>
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-foreground leading-none">Lumina</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide uppercase">Emotional Intelligence</p>
            </div>
          </div>
        </div>

        <div className="mx-4 h-px bg-border" />

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative
                  ${active
                    ? 'text-primary bg-primary/10 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-primary before:rounded-r-full'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <item.icon size={18} />
                <span className="hidden lg:block">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status */}
        <div className="p-3 lg:p-4 mx-2 lg:mx-3 mb-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-glow-pulse" />
            <span className="hidden lg:block text-xs text-foreground">AI Model</span>
            <span className="hidden lg:block text-xs text-success ml-auto">Online</span>
          </div>
          <p className="hidden lg:block text-[10px] text-muted-foreground mt-1.5">Lumina v1.0</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 flex">
        {navItems.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors
                ${active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
