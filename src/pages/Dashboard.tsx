import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bell, Upload, MessageCircle, Calendar, BookOpen, Clock, Target } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";

const Dashboard = () => {
  const navigate = useNavigate();
  const { playClickSound } = useVoice();
  const todaysTasks = [
    {
      subject: "Mathematics",
      topic: "Calculus - Integration",
      duration: "45 min",
      difficulty: "Medium",
      color: "info",
    },
    {
      subject: "Physics",
      topic: "Thermodynamics - Laws",
      duration: "60 min",
      difficulty: "Hard",
      color: "warm",
    },
    {
      subject: "Chemistry",
      topic: "Organic Chemistry - Basics",
      duration: "30 min",
      difficulty: "Easy",
      color: "success",
    },
  ];

  const courses = [
    { name: "Mathematics", progress: 65, units: "4/6" },
    { name: "Physics", progress: 45, units: "3/6" },
    { name: "Chemistry", progress: 80, units: "5/6" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-info/10 pb-20 md:pb-8 md:pt-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Hi Alex 💛</h1>
              <p className="text-muted-foreground">Here's your study plan for today</p>
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
              {todaysTasks.map((task, index) => (
                <Card
                  key={index}
                  className="p-5 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => {
                    playClickSound();
                    navigate(`/study/${task.subject}?topic=${encodeURIComponent(task.topic)}`);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${task.color}`} />
                        <h3 className="font-semibold text-foreground">{task.subject}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full bg-${task.color}/20 text-${task.color}-foreground`}>
                          {task.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">{task.topic}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {task.duration}
                    </div>
                  </div>
                </Card>
              ))}
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
                <span className="text-sm">Ask Lovable</span>
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
              {courses.map((course, index) => (
                <Card key={index} className="p-5 shadow-card">
                  <h3 className="font-semibold mb-3">{course.name}</h3>
                  <Progress value={course.progress} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Units: {course.units}</span>
                    <span className="font-medium text-primary">{course.progress}%</span>
                  </div>
                </Card>
              ))}
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
  );
};

export default Dashboard;
