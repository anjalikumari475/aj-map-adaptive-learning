import { useState } from "react";
import { Link } from "wouter";
import { User, LogOut, ChevronDown } from "lucide-react";
import { getStoredUser, clearStoredUser } from "@/lib/storage";

export default function Header({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const user = getStoredUser();

  function handleLogout() {
    clearStoredUser();
    window.location.href = "/login";
  }

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          <span className="text-foreground font-medium">{user?.name ?? "Account"}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-border bg-card shadow-lg p-1">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Link href="/account">
                <a className="flex items-center gap-2 px-3 py-2 rounded text-sm text-foreground hover:bg-accent cursor-pointer" onClick={() => setOpen(false)}>
                  <User size={14} />
                  My Account
                </a>
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 rounded text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
