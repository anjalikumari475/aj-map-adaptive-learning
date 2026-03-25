import { Link } from "wouter";
import { BarChart2, Code2, Shield, ArrowRight } from "lucide-react";
import { COURSES } from "@/lib/courses";

const ICONS: Record<string, React.ReactNode> = {
  chart: <BarChart2 size={28} />,
  code: <Code2 size={28} />,
  shield: <Shield size={28} />,
};

export default function Courses() {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">All Courses</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose a course to begin your learning journey</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {COURSES.map((course) => (
          <div key={course.id}
            className="rounded-xl border border-border bg-card flex flex-col overflow-hidden hover:border-primary/30 transition-colors group">
            <div className="p-5 pb-0">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: `linear-gradient(135deg, ${course.accentColor}22, ${course.accentColor}11)`,
                  color: course.accentColor,
                }}
              >
                {ICONS[course.icon]}
              </div>
              <h3 className="font-bold text-foreground text-base">{course.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{course.description}</p>
            </div>
            <div className="p-5 pt-4 flex flex-col gap-3 mt-auto">
              <div className="flex flex-wrap gap-2">
                {course.videos.map((v, i) => (
                  <span key={v.id} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Module {i + 1}
                  </span>
                ))}
              </div>
              <Link href={`/courses/${course.id}`}>
                <a
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ background: course.accentColor, color: "hsl(222,47%,11%)" }}
                >
                  Start Course <ArrowRight size={15} />
                </a>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
