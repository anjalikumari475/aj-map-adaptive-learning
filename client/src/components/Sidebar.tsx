import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, TrendingUp, Award } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/certifications", label: "Certifications", icon: Award },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r border-sidebar-border bg-sidebar shrink-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="relative w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, hsl(186,100%,50%,0.15), hsl(271,90%,65%,0.15))" }}>
          <svg width="22" height="22" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="18" r="5" fill="hsl(186,100%,50%)" />
            <circle cx="16" cy="38" r="5" fill="hsl(271,90%,65%)" />
            <circle cx="40" cy="38" r="5" fill="hsl(32,95%,60%)" />
            <line x1="28" y1="23" x2="16" y2="33" stroke="hsl(186,100%,50%)" strokeWidth="2" />
            <line x1="28" y1="23" x2="40" y2="33" stroke="hsl(186,100%,50%)" strokeWidth="2" />
            <line x1="21" y1="38" x2="35" y2="38" stroke="hsl(186,100%,50%)" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-sm text-foreground leading-none">AJ Map</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 leading-none">Adaptive Learning</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <a
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground">© 2026 AJ Map</p>
      </div>
    </aside>
  );
}
