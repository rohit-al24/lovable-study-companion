import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";

const Schedule = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = [15, 16, 17, 18, 19, 20, 21];

  const schedule = [
    { day: 0, time: "9:00 AM", subject: "Mathematics", topic: "Calculus", duration: "1h", color: "info" },
    { day: 0, time: "2:00 PM", subject: "Physics", topic: "Thermodynamics", duration: "1.5h", color: "warm" },
    { day: 1, time: "10:00 AM", subject: "Chemistry", topic: "Organic Chem", duration: "1h", color: "success" },
    { day: 2, time: "9:00 AM", subject: "Mathematics", topic: "Integration", duration: "45m", color: "info" },
    { day: 2, time: "3:00 PM", subject: "Computer Science", topic: "Data Structures", duration: "2h", color: "primary" },
    { day: 3, time: "11:00 AM", subject: "Physics", topic: "Laws of Motion", duration: "1h", color: "warm" },
    { day: 4, time: "9:00 AM", subject: "Chemistry", topic: "Electrochemistry", duration: "1h", color: "success" },
    { day: 5, time: "10:00 AM", subject: "Mathematics", topic: "Practice Problems", duration: "2h", color: "info" },
  ];

  const exams = [
    { date: "May 25", subject: "Mathematics", time: "10:00 AM" },
    { date: "May 28", subject: "Physics", time: "2:00 PM" },
    { date: "Jun 2", subject: "Chemistry", time: "9:00 AM" },
  ];

  // Map semantic color keys to explicit Tailwind classes (avoids dynamic class scanning issues)
  const colorMap: Record<string, string> = {
    info: "bg-info/10 border-info/20",
    warm: "bg-warm/10 border-warm/20",
    success: "bg-success/10 border-success/20",
    primary: "bg-primary/10 border-primary/20",
  };

  // Study planner state
  const [notesText, setNotesText] = useState("");
  const [subject, setSubject] = useState("");
  const [units, setUnits] = useState<Array<any>>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<Array<any>>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [studyDays, setStudyDays] = useState<number>(7);
  const [examDate, setExamDate] = useState<string>("");
  const [quiz, setQuiz] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-info/10 to-secondary/10 pb-20 md:pb-8 md:pt-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Study Schedule</h1>
              <p className="text-muted-foreground">Your personalized weekly plan</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Auto-Adjust
            </Button>
          </div>

          {/* Study Planner */}
          <Card className="p-4 shadow-card">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Study Planner (Notes → Units → Schedule → Quiz)</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Subject</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., Physics" />

                  <label className="text-sm">Paste notes or long text</label>
                  <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} rows={8} className="w-full p-2 border rounded" placeholder="Paste extracted PDF text or notes here" />

                  <div className="flex gap-2">
                    <Button onClick={async () => {
                      setUnitsLoading(true); setUnits([]); setScheduleResult([]); setQuiz(null);
                      try {
                        const { apiUrl } = await import('@/lib/api');
                        const res = await fetch(apiUrl('/api/llm/units'), { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ context: notesText, subject }) });
                        const data = await res.json();
                        // backend may return array directly or wrapped
                        const unitsData = Array.isArray(data) ? data : (data.units || data);
                        setUnits(unitsData || []);
                      } catch (e) {
                        console.error(e);
                        setUnits([]);
                      } finally { setUnitsLoading(false); }
                    }} className="bg-primary text-white">{unitsLoading ? 'Analyzing...' : 'Analyze Units'}</Button>

                    <Button onClick={async () => {
                      // prepare simple units array of strings
                      const unitNames = units.map((u:any) => (typeof u === 'string' ? u : (u.unit || u.title || u.name || JSON.stringify(u))));
                      if (unitNames.length === 0) return;
                      setScheduleLoading(true); setScheduleResult([]);
                      try {
                        const { apiUrl } = await import('@/lib/api');
                        const res = await fetch(apiUrl('/api/llm/schedule'), { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ units: unitNames, study_days: studyDays, exam_date: examDate }) });
                        const data = await res.json();
                        const sched = data.schedule || data;
                        setScheduleResult(sched || []);
                      } catch (e) {
                        console.error(e);
                        setScheduleResult([]);
                      } finally { setScheduleLoading(false); }
                    }} className="bg-emerald-600 text-white">{scheduleLoading ? 'Generating...' : 'Generate Schedule'}</Button>

                    <input type="number" min={1} value={studyDays} onChange={(e) => setStudyDays(Number(e.target.value))} className="w-24 p-2 border rounded" />
                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="p-2 border rounded" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Detected Units</h3>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {units.length === 0 && <p className="text-sm text-muted-foreground">No units detected yet.</p>}
                    {units.map((u:any, idx:number) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{typeof u === 'string' ? u : (u.unit || u.title || `Unit ${idx+1}`)}</p>
                            <p className="text-sm text-muted-foreground">{typeof u === 'string' ? '' : (u.summary || '')}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" onClick={async () => {
                              // generate quiz for this unit
                              const context = (typeof u === 'string' ? u : (u.summary ? `${u.unit}\n${u.summary}` : JSON.stringify(u)));
                              setQuizLoading(true); setQuiz(null);
                              try {
                                const { apiUrl } = await import('@/lib/api');
                                const res = await fetch(apiUrl('/api/llm/quiz'), { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ context, num_questions: 5, subject }) });
                                const data = await res.json();
                                setQuiz(data);
                              } catch (e) {
                                console.error(e);
                                setQuiz(null);
                              } finally { setQuizLoading(false); }
                            }}>Generate Quiz</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {scheduleResult && scheduleResult.length > 0 && (
                <div>
                  <h3 className="font-medium mt-2">Generated Schedule</h3>
                  <div className="mt-2 space-y-2">
                    {scheduleResult.map((d:any, i:number) => (
                      <Card key={i} className="p-3">
                        <p className="font-semibold">Day {d.day ?? i+1}</p>
                        <p className="text-sm text-muted-foreground">{Array.isArray(d.units) ? d.units.join(', ') : JSON.stringify(d.units)}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {quizLoading && <p>Generating quiz...</p>}
              {quiz && (
                <div>
                  <h3 className="font-medium mt-2">Quiz</h3>
                  <div className="space-y-3 mt-2">
                    {(quiz.questions || []).map((q:any, i:number) => (
                      <Card key={i} className="p-3">
                        <p className="font-semibold">{i+1}. {q.question}</p>
                        <ul className="list-disc list-inside text-sm mt-2">
                          {(q.options || []).map((opt:string, j:number) => (
                            <li key={j} className={q.answer === j ? 'font-semibold text-foreground' : ''}>{opt}</li>
                          ))}
                        </ul>
                        {q.explanation && <p className="text-xs text-muted-foreground mt-2">Explanation: {q.explanation}</p>}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Month Navigation */}
          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-semibold">May 2024</h2>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>

          {/* Weekly Calendar */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => (
              <div key={day} className="space-y-2">
                <Card className={`p-3 text-center shadow-card ${index === 2 ? "bg-primary/10 border-primary" : ""}`}>
                  <p className="text-xs text-muted-foreground">{day}</p>
                  <p className="text-lg font-semibold">{dates[index]}</p>
                </Card>

                {/* Schedule Items */}
                <div className="space-y-2">
                  {schedule
                    .filter((item) => item.day === index)
                    .map((item, idx) => (
                      <Card
                          key={idx}
                          className={`p-3 shadow-card ${colorMap[item.color] || "bg-card"} hover:shadow-hover transition-all duration-300 cursor-pointer`}
                        >
                        <p className="text-xs font-medium text-foreground">{item.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {item.duration}
                        </Badge>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Exams */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Exams
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              {exams.map((exam, index) => (
                <Card key={index} className="p-5 shadow-card bg-gradient-to-br from-primary/5 to-warm/5">
                  <div className="space-y-3">
                    <Badge className="bg-primary text-white">{exam.date}</Badge>
                    <div>
                      <h3 className="font-semibold text-lg">{exam.subject}</h3>
                      <p className="text-sm text-muted-foreground">{exam.time}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Help Card */}
          <Card className="p-6 bg-gradient-to-br from-info/10 to-success/10 border-none shadow-card">
            <div className="text-center space-y-2">
              <p className="font-medium">Missed a study session?</p>
              <p className="text-sm text-muted-foreground">
                Don't worry! Click Auto-Adjust to update your schedule
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
