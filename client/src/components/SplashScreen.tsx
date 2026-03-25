import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2000);
    const done = setTimeout(() => onDone(), 2700);
    return () => {
      clearTimeout(timer);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "hsl(222, 47%, 9%)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.7s ease-out",
        pointerEvents: fadeOut ? "none" : "all",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, hsl(186,100%,50%), hsl(271,90%,65%))",
              opacity: 0.15,
            }}
          />
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="hsl(186,100%,50%)" strokeWidth="2" />
            <circle cx="28" cy="18" r="5" fill="hsl(186,100%,50%)" />
            <circle cx="16" cy="36" r="5" fill="hsl(271,90%,65%)" />
            <circle cx="40" cy="36" r="5" fill="hsl(32,95%,60%)" />
            <line x1="28" y1="23" x2="16" y2="31" stroke="hsl(186,100%,50%)" strokeWidth="1.5" />
            <line x1="28" y1="23" x2="40" y2="31" stroke="hsl(186,100%,50%)" strokeWidth="1.5" />
            <line x1="21" y1="36" x2="35" y2="36" stroke="hsl(186,100%,50%)" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
        </div>
        <div className="text-center">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "hsl(186,100%,50%)" }}
          >
            AJ Map
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(215,20%,65%)" }}>
            Adaptive Learning Platform
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: "hsl(186,100%,50%)",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
