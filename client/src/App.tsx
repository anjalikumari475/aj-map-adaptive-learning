import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SplashScreen from "@/components/SplashScreen";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getStoredUser } from "@/lib/storage";

import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Progress from "@/pages/Progress";
import Certifications from "@/pages/Certifications";
import Account from "@/pages/Account";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/courses": "Courses",
  "/progress": "Progress",
  "/certifications": "Certifications",
  "/account": "My Account",
};

function AppLayout() {
  const [location] = useLocation();
  const user = getStoredUser();

  if (!user) return <Redirect to="/login" />;

  const title =
    PAGE_TITLES[location] ??
    (location.startsWith("/courses/") ? "Course" : "AJ Map");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/courses" component={Courses} />
            <Route path="/courses/:courseId" component={CourseDetail} />
            <Route path="/progress" component={Progress} />
            <Route path="/certifications" component={Certifications} />
            <Route path="/account" component={Account} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function Router() {
  const user = getStoredUser();
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        {user ? <AppLayout /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
          {!showSplash && <Router />}
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
