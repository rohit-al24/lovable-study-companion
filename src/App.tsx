import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Welcome from "./pages/onboarding/Welcome";
import Profile from "./pages/onboarding/Profile";
import Preferences from "./pages/onboarding/Preferences";
import ExamSchedule from "./pages/onboarding/ExamSchedule";
import Finish from "./pages/onboarding/Finish";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Chat from "./pages/Chat";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/onboarding/profile" element={<Profile />} />
          <Route path="/onboarding/preferences" element={<Preferences />} />
          <Route path="/onboarding/exam-schedule" element={<ExamSchedule />} />
          <Route path="/onboarding/finish" element={<Finish />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
