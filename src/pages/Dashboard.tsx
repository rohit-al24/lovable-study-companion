
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/api";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bell, Upload, MessageCircle, Calendar, BookOpen, Clock, Target } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import AssistantBubble from "@/components/AssistantBubble";

const Dashboard = () => {
  const navigate = useNavigate();

  // Use selected voice from localStorage if set
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  useEffect(() => {
    const v = localStorage.getItem("griffin_voice");
    if (v) setSelectedVoice(v);
  }, []);
  const { playClickSound } = useVoice(selectedVoice);
  const [courses, setCourses] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = (userData as any)?.user?.id || null;
        setUserId(uid);
        if (!uid) return;
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('user_id', uid);
        if (!error) setCourses(data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Optionally, you can implement a real "Today's Study Plan" based on course data or leave it empty for now
  const todaysTasks: any[] = [];

  // Assistant UI + voice
  const [assistantMessage, setAssistantMessage] = useState<string>("");
  const { speak } = useVoice(selectedVoice);

  // Handler for assistant queries: send to LLM backend and speak/display reply
  const handleAssistantQuery = async (query: string) => {
    setAssistantMessage('Thinking...');
    try {
      const resp = await fetch(apiUrl('/api/llm/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, context: { courses } }),
      });
      const data = await resp.json();
      const answer = data?.answer || data?.text || 'Sorry, no answer from the assistant.';
      setAssistantMessage(answer);
      speak && speak(answer, 1);
      setTimeout(() => setAssistantMessage(''), 10000);
    } catch (err) {
      const msg = 'Error contacting assistant.';
      setAssistantMessage(msg);
      console.error(err);
      setTimeout(() => setAssistantMessage(''), 6000);
    }
  };
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-info/10 pb-20 md:pb-8 md:pt-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Hi from Griffin 💙</h1>
                <p className="text-muted-foreground">Griffin has prepared your study plan for today</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Overview */}
          <Card className="p-6 shadow-card bg-gradient-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Semester Progress</h3>
              <span className="text-2xl font-bold text-primary">68%</span>
            </div>
            <Progress value={68} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              Great progress! Keep up the momentum 🎯
            </p>
          </Card>

          {/* Today's Study Plan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Today's Study Plan
              </h2>
            </div>

            <div className="grid gap-4">
              {todaysTasks.length === 0 && (
                <div className="text-muted-foreground text-sm">No study plan for today.</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">Upload Notes</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              >
                <MessageCircle className="w-6 h-6" />
                  <span className="text-sm">Ask Griffin</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-sm">View Schedule</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              >
                <BookOpen className="w-6 h-6" />
                <span className="text-sm">My Courses</span>
              </Button>
            </div>
          </div>

          {/* Course Progress */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Course Progress</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {loading ? (
                <div className="text-muted-foreground text-sm">Loading courses...</div>
              ) : courses.length === 0 ? (
                <div className="text-muted-foreground text-sm">No courses found.</div>
              ) : (
                courses.map((course, index) => (
                  <div
                    key={index}
                    className="cursor-pointer"
                    onClick={() => {
                      playClickSound && playClickSound();
                      navigate(`/study/${encodeURIComponent(course.name)}`);
                    }}
                  >
                    <Card className="p-5 shadow-card hover:border-primary hover:shadow-lg transition-all">
                      <h3 className="font-semibold mb-3">{course.name}</h3>
                      <Progress value={course.progress} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Units: {course.units}</span>
                        <span className="font-medium text-primary">{course.progress}%</span>
                      </div>
                    </Card>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Motivation */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-warm/10 border-none shadow-card">
            <p className="text-center text-lg font-medium text-foreground">
              "Small steps make big progress. Keep going!" ✨
            </p>
          </Card>
        </div>
      </div>
      </div>
      <FloatingAssistant onQuery={handleAssistantQuery} />
      {assistantMessage && (
        <AssistantBubble message={assistantMessage} onClose={() => setAssistantMessage('')} />
      )}
    </>
  );
};

export default Dashboard;
