import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

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
                        className={`p-3 shadow-card bg-${item.color}/10 border-${item.color}/20 hover:shadow-hover transition-all duration-300 cursor-pointer`}
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
