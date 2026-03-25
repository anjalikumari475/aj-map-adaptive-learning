export interface Video {
  id: string;
  title: string;
  youtubeId: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  accentColor: string;
  videos: Video[];
}

export const COURSES: Course[] = [
  {
    id: "data-analyst",
    title: "Data Analyst",
    description: "Master data analysis, visualization, and statistical thinking to turn raw data into powerful insights.",
    icon: "chart",
    color: "from-blue-500 to-cyan-400",
    accentColor: "#06b6d4",
    videos: [
      { id: "da-1", title: "Introduction to Data Analysis", youtubeId: "Liv2MfdJIvg" },
      { id: "da-2", title: "Python for Data Analysis", youtubeId: "iuBaJtW5gA8" },
      { id: "da-3", title: "Data Visualization with Matplotlib", youtubeId: "QYcnkHWHFbE" },
      { id: "da-4", title: "SQL for Data Analysts", youtubeId: "1VCWpRwZ4dM" },
      { id: "da-5", title: "Machine Learning Basics", youtubeId: "bDTE7aJZSaM" },
    ],
  },
  {
    id: "web-developer",
    title: "Web Developer",
    description: "Build modern, responsive web apps from scratch using HTML, CSS, JavaScript, and popular frameworks.",
    icon: "code",
    color: "from-purple-500 to-violet-400",
    accentColor: "#8b5cf6",
    videos: [
      { id: "wd-1", title: "HTML & CSS Fundamentals", youtubeId: "ysEN5RaKOlA" },
      { id: "wd-2", title: "JavaScript Essentials", youtubeId: "UB1O30fR-EE" },
      { id: "wd-3", title: "React.js for Beginners", youtubeId: "h0e2HAPTGF0" },
      { id: "wd-4", title: "Node.js & Express Backend", youtubeId: "G3e-cpL7ofc" },
      { id: "wd-5", title: "Full Stack Project Walkthrough", youtubeId: "SBmUHDkbHUA" },
    ],
  },
  {
    id: "cyber-security",
    title: "Cyber Security",
    description: "Learn ethical hacking, network security, and best practices to protect systems from threats.",
    icon: "shield",
    color: "from-orange-500 to-red-400",
    accentColor: "#f97316",
    videos: [
      { id: "cs-1", title: "Introduction to Cyber Security", youtubeId: "inWWhr5tnEA" },
      { id: "cs-2", title: "Network Security Fundamentals", youtubeId: "hXSFdwxNqMs" },
      { id: "cs-3", title: "Ethical Hacking Basics", youtubeId: "U_P23SqJaDc" },
      { id: "cs-4", title: "Cryptography & Encryption", youtubeId: "nzZkKoREEGo" },
      { id: "cs-5", title: "Security Best Practices", youtubeId: "26ABzvAuyS8" },
    ],
  },
];

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}
