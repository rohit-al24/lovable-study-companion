
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
  const [lastPendingQueryForNotes, setLastPendingQueryForNotes] = useState<string | null>(null);
  const { speak } = useVoice(selectedVoice);

  // Handler for assistant queries: send to LLM backend and speak/display reply
  const handleAssistantQuery = async (query: string) => {
    setAssistantMessage('Thinking...');
    try {
      const q = query.trim().toLowerCase();
      const findCourseByName = (name: string) => {
        if (!name) return null;
        const lowered = name.toLowerCase();
        return courses.find((c) => (c.name || '').toLowerCase().includes(lowered) || lowered.includes((c.name || '').toLowerCase()));
      };

      const handleLocal = () => {
        if (!Array.isArray(courses) || courses.length === 0) return null;
        // Check overall progress
        if (q.includes('overall progress') || q.includes('semester progress') || q.includes('average progress') || q.includes('my progress')) {
          const avg = Math.round((courses.reduce((acc, c) => acc + (c.progress || 0), 0) || 0) / Math.max(1, courses.length));
          return `Your average progress across ${courses.length} course(s) is ${avg}%.`;
        }
        // Specific course progress: e.g., "what is the progress of Data Structures"
        if (q.includes('progress') || q.includes('how much')) {
          // try to detect course name from query
          for (const c of courses) {
            const name = (c.name || '').toLowerCase();
            if (!name) continue;
            if (q.includes(name) || query.toLowerCase().includes(name)) {
              const prog = c.progress || 0;
              const units = c.units || 0;
              const completed = c.completed || 0;
              const notesCount = Array.isArray(c.notes_list) ? c.notes_list.length : (c.notes ? 1 : 0);
              return `Course ${c.name}: ${prog}% complete — ${completed} of ${units} units done. Notes: ${notesCount}.`;
            }
          }
        }
        // Course counts or list
        if (q.includes('how many courses') || q.includes('total courses') || q.includes('list of courses') || q.includes('what courses')) {
          const names = courses.map((c) => c.name).filter(Boolean).join(', ');
          return `You have ${courses.length} course(s): ${names}.`;
        }
        // Units/hours
        if (q.includes('hours') || q.includes('hours studied')) {
          const hours = courses.reduce((acc, c) => acc + (c.hoursCompleted || 0), 0);
          return `You've studied a total of ${hours} hour(s) across all courses.`;
        }
        return null;
      };

      const localAnswer = handleLocal();
      if (localAnswer) {
        setAssistantMessage(localAnswer);
        speak && speak(localAnswer, 1);
        setTimeout(() => setAssistantMessage(''), 10000);
        return localAnswer;
      }

      // If user replied 'yes' to use local notes for the last query, handle that
      if (q === 'yes' || q === 'use notes' || q === 'use my notes') {
        if (lastPendingQueryForNotes) {
          const allNotes = Array.isArray(courses) ? courses.map((c) => c.notes || '').join('\n') : '';
          setAssistantMessage('Using your local notes...');
          const resp2 = await fetch(apiUrl('/api/llm/ask'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: lastPendingQueryForNotes, context: allNotes }),
          });
          const data2 = await resp2.json();
          const answer2 = data2?.answer || data2?.text || 'Sorry, no answer from the assistant.';
          setAssistantMessage(answer2);
          speak && speak(answer2, 1);
          setLastPendingQueryForNotes(null);
          setTimeout(() => setAssistantMessage(''), 10000);
          return answer2;
        }
      }

      // Combine all notes from all courses into a single string for context
      const allNotes = Array.isArray(courses)
        ? courses.map((c) => c.notes || '').join('\n')
        : '';

      // Try to detect specific course mentioned in query and prefer its notes
      const matched = Array.isArray(courses)
        ? courses.filter((c) => {
            const name = (c.name || '').toLowerCase();
            return name && (q.includes(name) || name.includes(q) || query.toLowerCase().includes(name));
          })
        : [];

      let contextToSend = allNotes;
      if (matched && matched.length > 0) {
        contextToSend = matched.map((c) => c.notes || '').join('\n');
      }

      const resp = await fetch(apiUrl('/api/llm/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, context: contextToSend }),
      });
      const data = await resp.json();
      let answer = data?.answer || data?.text || '';
      // If we had no course matched and the LLM returned an empty/unsure answer,
      // first try a general LLM call (no context) before offering the local-notes fallback.
      if ((!matched || matched.length === 0) && (!answer || answer.trim() === '')) {
        try {
          const gen = await fetch(apiUrl('/api/llm/ask'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: query, context: '' }),
          });
          if (gen.ok) {
            const gd = await gen.json();
            const genAnswer = gd?.answer || gd?.text || '';
            if (genAnswer && genAnswer.trim() !== '') {
              answer = genAnswer;
            }
          }
        } catch (e) {
          // ignore and fall through to fallback
        }
        if (!answer || answer.trim() === '') {
          const fallback = "I don't see local notes for that topic. I can still try to answer generally — would you like me to use your local notes to expand? Reply 'yes' to use them.";
          setLastPendingQueryForNotes(query);
          setAssistantMessage(fallback);
          speak && speak(fallback, 1);
          setTimeout(() => setAssistantMessage(''), 10000);
          return fallback;
        }
      }

      // If answer is empty, fall back to canned greetings
      if (!answer || /not in the provided notes|i don't know/i.test(answer)) {
        const q2 = query.trim().toLowerCase();
        if (q2.includes('hello') || q2.includes('hi')) answer = "Hello! How can I help you today?";
        else if (q2.includes('how are you')) answer = "I'm just a bunch of code, but I'm here to help you study!";
        else if (q2.includes('who are you')) answer = "I'm Griffin, your study companion!";
        else if (q2.includes('thank')) answer = "You're welcome! Let me know if you need anything else.";
        else answer = 'Sorry, no answer from the assistant.';
      }

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
