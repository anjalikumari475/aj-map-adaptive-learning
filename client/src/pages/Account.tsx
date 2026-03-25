import { User, Mail, LogOut, Calendar } from "lucide-react";
import { getStoredUser, clearStoredUser } from "@/lib/storage";

export default function Account() {
  const user = getStoredUser();

  function handleLogout() {
    clearStoredUser();
    window.location.href = "/login";
  }

  return (
    <div className="p-6 max-w-xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">My Account</h2>
        <p className="text-muted-foreground text-sm mt-1">Your profile information</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center border-b border-border"
          style={{ background: "linear-gradient(135deg, hsl(186,100%,50%,0.08), hsl(271,90%,65%,0.05))" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg, hsl(186,100%,50%,0.2), hsl(271,90%,65%,0.2))", border: "2px solid hsl(186,100%,50%,0.3)" }}>
            <User size={36} style={{ color: "hsl(186,100%,50%)" }} />
          </div>
          <h3 className="text-lg font-bold text-foreground">{user?.name}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-5 py-4">
            <User size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Mail size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Calendar size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="text-sm font-medium text-foreground font-mono text-xs">{user?.id}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full justify-center py-2.5 rounded-lg text-sm font-semibold border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
