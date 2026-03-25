import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Play, Download, Trophy } from "lucide-react";
import { getStoredUser } from "@/lib/storage";
import { getCourseById } from "@/lib/courses";
import FlowChart from "@/components/FlowChart";
import { generateCertificatePDF } from "@/lib/certificate";

interface CourseProgress {
  courseId: string;
  completedVideos: string[];
  totalVideos: number;
  percentComplete: number;
  completed: boolean;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = getCourseById(courseId ?? "");
  const user = getStoredUser();
  const queryClient = useQueryClient();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState(false);

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

  const progress = progressList.find((p) => p.courseId === courseId);
  const completedVideos: string[] = progress?.completedVideos ?? [];

  const updateProgress = useMutation({
    mutationFn: async (newCompleted: string[]) => {
      const res = await fetch(`/api/progress/${user!.id}/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedVideos: newCompleted, totalVideos: course!.videos.length }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", user?.id] });
    },
  });

  function handleVideoClick(videoId: string) {
    setActiveVideo(videoId);
    if (!completedVideos.includes(videoId)) {
      const newCompleted = [...completedVideos, videoId];
      updateProgress.mutate(newCompleted);
    }
  }

  async function handleDownloadCert() {
    if (!user?.id || !courseId || !course) return;
    setCertLoading(true);
    try {
      const res = await fetch(`/api/certificates/${user.id}/${courseId}`, { method: "POST" });
      const cert = await res.json();
      generateCertificatePDF({
        userName: cert.userName,
        courseName: cert.courseName,
        issuedAt: cert.issuedAt,
      });
      queryClient.invalidateQueries({ queryKey: ["certificates", user.id] });
    } catch {
    } finally {
      setCertLoading(false);
    }
  }

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Link href="/courses"><a className="text-primary text-sm mt-2 inline-block">Back to Courses</a></Link>
      </div>
    );
  }

  const completed = completedVideos.length;
  const total = course.videos.length;
  const isDone = completed >= total;

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-5">
        <Link href="/courses">
          <a className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft size={15} /> Back to Courses
          </a>
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">{course.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
          </div>
          {isDone && (
            <button
              onClick={handleDownloadCert}
              disabled={certLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ background: "hsl(160,70%,45%)", color: "white" }}
            >
              <Download size={15} />
              {certLoading ? "Generating..." : "Download Certificate"}
            </button>
          )}
        </div>
      </div>

      {isDone && (
        <div className="rounded-xl p-5 mb-5 flex items-center gap-3"
          style={{ background: "hsl(160,70%,45%,0.12)", border: "1px solid hsl(160,70%,45%,0.3)" }}>
          <Trophy size={24} style={{ color: "hsl(160,70%,55%)" }} />
          <div>
            <p className="font-semibold" style={{ color: "hsl(160,70%,55%)" }}>Course Completed!</p>
            <p className="text-sm text-muted-foreground">You have successfully completed all {total} modules. Download your certificate above.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-4">
          {activeVideo && (
            <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video">
              <iframe
                key={activeVideo}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                title="Video lesson"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">Course Modules</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{completed}/{total} completed</p>
            </div>
            <div className="divide-y divide-border">
              {course.videos.map((video, i) => {
                const isCompleted = completedVideos.includes(video.youtubeId);
                const isActive = activeVideo === video.youtubeId;

                return (
                  <button
                    key={video.id}
                    onClick={() => handleVideoClick(video.youtubeId)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent"
                    style={isActive ? { background: `${course.accentColor}11` } : {}}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        background: isCompleted
                          ? course.accentColor + "22"
                          : "hsl(217,33%,17%)",
                        color: isCompleted ? course.accentColor : "hsl(215,20%,50%)",
                      }}
                    >
                      {isCompleted ? <CheckCircle size={16} style={{ color: course.accentColor }} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {video.title}
                      </p>
                    </div>
                    <Play size={14} className="shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Learning Path</h3>
            <div className="flex flex-col items-center gap-3">
              <FlowChart
                totalSteps={course.videos.length}
                completedSteps={completed}
                accentColor={course.accentColor}
                mini={false}
              />
              <div className="flex flex-col gap-2 w-full mt-2">
                {course.videos.map((video, i) => {
                  const isCompleted = completedVideos.includes(video.youtubeId);
                  const isCurrent = i === completed && !isDone;
                  return (
                    <div key={video.id} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border shrink-0"
                        style={{
                          background: isCompleted ? course.accentColor : "transparent",
                          borderColor: isCompleted
                            ? course.accentColor
                            : isCurrent
                            ? course.accentColor
                            : "hsl(215,20%,30%)",
                        }}
                      />
                      <span className={`text-[11px] ${isCompleted ? "text-muted-foreground line-through" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {video.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground font-medium">Overall Progress</span>
              <span className="font-bold text-foreground">{Math.round((completed / total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(completed / total) * 100}%`, background: course.accentColor }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{completed} of {total} modules completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
