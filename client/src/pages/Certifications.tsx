import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Download, Lock } from "lucide-react";
import { getStoredUser } from "@/lib/storage";
import { COURSES } from "@/lib/courses";
import { generateCertificatePDF } from "@/lib/certificate";
import { useState } from "react";

interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  userName: string;
  issuedAt: string;
}

interface CourseProgress {
  courseId: string;
  completedVideos: string[];
  totalVideos: number;
  percentComplete: number;
  completed: boolean;
}

export default function Certifications() {
  const user = getStoredUser();
  const queryClient = useQueryClient();
  const [loadingCourse, setLoadingCourse] = useState<string | null>(null);

  const { data: certs = [] } = useQuery<Certificate[]>({
    queryKey: ["certificates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/certificates/${user.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });

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

  function isCourseCompleted(courseId: string): boolean {
    return progressList.find((p) => p.courseId === courseId)?.completed ?? false;
  }

  function getCert(courseId: string): Certificate | undefined {
    return certs.find((c) => c.courseId === courseId);
  }

  async function handleDownload(courseId: string) {
    if (!user?.id) return;
    setLoadingCourse(courseId);
    try {
      const res = await fetch(`/api/certificates/${user.id}/${courseId}`, { method: "POST" });
      const cert = await res.json();
      generateCertificatePDF({ userName: cert.userName, courseName: cert.courseName, issuedAt: cert.issuedAt });
      queryClient.invalidateQueries({ queryKey: ["certificates", user.id] });
    } catch {
    } finally {
      setLoadingCourse(null);
    }
  }

  const earnedCount = COURSES.filter((c) => isCourseCompleted(c.id)).length;

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Certifications</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {earnedCount} of {COURSES.length} certificates earned
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {COURSES.map((course) => {
          const completed = isCourseCompleted(course.id);
          const cert = getCert(course.id);
          const isLoading = loadingCourse === course.id;

          return (
            <div
              key={course.id}
              className="rounded-xl border bg-card p-5 flex items-center gap-4"
              style={{ borderColor: completed ? `${course.accentColor}33` : "hsl(217,33%,22%)" }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: completed ? `${course.accentColor}22` : "hsl(217,33%,17%)",
                  color: completed ? course.accentColor : "hsl(215,20%,40%)",
                }}
              >
                {completed ? <Award size={28} /> : <Lock size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-sm">{course.title}</h3>
                  {completed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${course.accentColor}22`, color: course.accentColor }}>
                      Earned
                    </span>
                  )}
                </div>
                {completed ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cert
                      ? `Issued on ${new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                      : "Ready to download"}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Complete all {course.videos.length} modules to unlock
                  </p>
                )}
              </div>
              {completed && (
                <button
                  onClick={() => handleDownload(course.id)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-80"
                  style={{ background: course.accentColor + "22", color: course.accentColor, border: `1px solid ${course.accentColor}44` }}
                >
                  <Download size={13} />
                  {isLoading ? "..." : "Download PDF"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
