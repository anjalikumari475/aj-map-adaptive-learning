import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BarChart2, Code2, Shield, ArrowRight } from "lucide-react";
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
  chart: <BarChart2 size={20} />,
  code: <Code2 size={20} />,
  shield: <Shield size={20} />,
};

export default function Progress() {
  const user = getStoredUser();

  const { data: progressList = [], isLoading } = useQuery<CourseProgress[]>({
    queryKey: ["progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/progress/${user.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });

  const totalVideos = COURSES.reduce((sum, c) => sum + c.videos.length, 0);
  const totalCompleted = progressList.reduce((sum, p) => sum + p.completedVideos.length, 0);
  const overallPct = totalVideos > 0 ? Math.round((totalCompleted / totalVideos) * 100) : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
        <p className="text-muted-foreground text-sm mt-1">Track your learning across all courses</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Overall Progress</p>
          <span className="text-lg font-bold text-primary">{overallPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${overallPct}%`, background: "hsl(186,100%,50%)" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{totalCompleted} of {totalVideos} total videos completed</p>
      </div>

      <div className="flex flex-col gap-4">
        {COURSES.map((course) => {
          const prog = progressList.find((p) => p.courseId === course.id);
          const completed = prog?.completedVideos.length ?? 0;
          const total = course.videos.length;
          const pct = Math.round(prog?.percentComplete ?? 0);
          const isDone = prog?.completed ?? false;

          return (
            <div key={course.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${course.accentColor}22`, color: course.accentColor }}
                >
                  {ICONS[course.icon]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">{course.title}</h3>
                    <span
                      className="text-sm font-bold"
                      style={{ color: isDone ? "hsl(160,70%,55%)" : course.accentColor }}
                    >
                      {isDone ? "Completed!" : `${pct}%`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{completed}/{total} videos watched</p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: isDone ? "hsl(160,70%,45%)" : course.accentColor }}
                />
              </div>

              <div className="flex items-center justify-between">
                <FlowChart
                  totalSteps={total}
                  completedSteps={completed}
                  accentColor={isDone ? "hsl(160,70%,45%)" : course.accentColor}
                  mini={true}
                />
                <Link href={`/courses/${course.id}`}>
                  <a className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {isDone ? "Review" : "Continue"} <ArrowRight size={12} />
                  </a>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
