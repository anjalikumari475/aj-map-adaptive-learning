import { useState } from "react";
import { setStoredUser } from "@/lib/storage";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignup && !name.trim()) {
      setError("Please enter your name.");
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || email.split("@")[0], email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed to sign in");
      const user = await res.json();
      setStoredUser({ id: user.id, name: user.name, email: user.email });
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(222,47%,9%)" }}>
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(186,100%,50%,0.15), hsl(271,90%,65%,0.15))", border: "1px solid hsl(186,100%,50%,0.3)" }}>
              <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="18" r="6" fill="hsl(186,100%,50%)" />
                <circle cx="14" cy="40" r="6" fill="hsl(271,90%,65%)" />
                <circle cx="42" cy="40" r="6" fill="hsl(32,95%,60%)" />
                <line x1="28" y1="24" x2="14" y2="34" stroke="hsl(186,100%,50%)" strokeWidth="2" />
                <line x1="28" y1="24" x2="42" y2="34" stroke="hsl(186,100%,50%)" strokeWidth="2" />
                <line x1="20" y1="40" x2="36" y2="40" stroke="hsl(186,100%,50%)" strokeWidth="1.5" strokeDasharray="3 2" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">AJ Map</h1>
          <p className="text-sm text-muted-foreground mt-1">Adaptive Learning Platform</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {isSignup ? "Start your learning journey today" : "Sign in to continue learning"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignup && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
              style={{ background: "hsl(186,100%,50%)", color: "hsl(222,47%,11%)", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isSignup ? "Already have an account?" : "New to AJ Map?"}{" "}
            <button
              onClick={() => { setIsSignup((v) => !v); setError(""); }}
              className="text-primary font-medium hover:underline"
            >
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
