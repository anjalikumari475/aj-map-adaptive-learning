import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BarChart2, Code2, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { getStoredUser } from "@/lib/storage";
import { COURSES } from "@/lib/courses";
import FlowChart from "@/components/FlowChart";

interface CourseProgress {
  courseId: string;
  completedVideos: string[];
  totalVideos: number;
  percentComplete: number;
  completed: boolean;
}

const ICONS: Record<string, React.ReactNode> = {
  chart: <BarChart2 size={22} />,
  code: <Code2 size={22} />,
  shield: <Shield size={22} />,
};

export default function Home() {
  const user = getStoredUser();

  const { data: progressList = [] } = useQuery<CourseProgress[]>({
    queryKey: ["progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/progress/${user.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });

  function getProgress(courseId: string): CourseProgress | undefined {
    return progressList.find((p) => p.courseId === courseId);
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto w-full">
      <div className="rounded-xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(186,100%,50%,0.12), hsl(271,90%,65%,0.08))", border: "1px solid hsl(186,100%,50%,0.2)" }}>
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: "hsl(186,100%,50%)", transform: "translate(30%, -30%)" }} />
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, <span style={{ color: "hsl(186,100%,50%)" }}>{user?.name?.split(" ")[0] ?? "Learner"}</span> 👋
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Continue your adaptive learning journey. Pick up where you left off or explore a new course.
        </p>
        <div className="flex gap-4 mt-4">
          <div className="bg-background/50 rounded-lg px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Courses Enrolled</p>
            <p className="text-xl font-bold text-foreground">{COURSES.length}</p>
          </div>
          <div className="bg-background/50 rounded-lg px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-xl font-bold text-foreground">
              {progressList.filter((p) => p.completed).length}
            </p>
          </div>
          <div className="bg-background/50 rounded-lg px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Videos Watched</p>
            <p className="text-xl font-bold text-foreground">
              {progressList.reduce((sum, p) => sum + p.completedVideos.length, 0)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">Your Courses</h3>
        <div className="grid gap-4">
          {COURSES.map((course) => {
            const prog = getProgress(course.id);
            const completed = prog?.completedVideos.length ?? 0;
            const total = prog?.totalVideos ?? course.videos.length;
            const pct = prog?.percentComplete ?? 0;
            const isDone = prog?.completed ?? false;

            return (
              <div
                key={course.id}
                className="rounded-xl border border-border bg-card flex flex-col md:flex-row md:items-center gap-4 p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${course.accentColor}22, ${course.accentColor}11)`,
                      border: `1px solid ${course.accentColor}33`,
                      color: course.accentColor,
                    }}
                  >
                    {ICONS[course.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground text-sm">{course.title}</h4>
                      {isDone && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "hsl(160,70%,45%,0.15)", color: "hsl(160,70%,55%)" }}>
                          <CheckCircle size={10} /> Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{course.description}</p>
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>{completed}/{total} videos</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: course.accentColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 md:flex-row flex-col md:ml-auto">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] text-muted-foreground text-center">Progress Map</p>
                    <FlowChart
                      totalSteps={course.videos.length}
                      completedSteps={completed}
                      accentColor={course.accentColor}
                      mini={true}
                    />
                  </div>
                  <Link href={`/courses/${course.id}`}>
                    <a
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
                      style={{
                        background: course.accentColor + "22",
                        color: course.accentColor,
                        border: `1px solid ${course.accentColor}44`,
                      }}
                    >
                      {completed > 0 && !isDone ? "Continue" : isDone ? "Review" : "Start"}
                      <ArrowRight size={12} />
                    </a>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
