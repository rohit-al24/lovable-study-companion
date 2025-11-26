import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Target, TrendingUp } from "lucide-react";

const Courses = () => {
  const courses = [
    {
      name: "Mathematics",
      units: 6,
      completed: 4,
      progress: 65,
      nextTopic: "Advanced Integration",
      color: "info",
      totalHours: 24,
      hoursCompleted: 16,
    },
    {
      name: "Physics",
      units: 6,
      completed: 3,
      progress: 45,
      nextTopic: "Thermodynamics Laws",
      color: "warm",
      totalHours: 28,
      hoursCompleted: 13,
    },
    {
      name: "Chemistry",
      units: 6,
      completed: 5,
      progress: 80,
      nextTopic: "Electrochemistry",
      color: "success",
      totalHours: 20,
      hoursCompleted: 16,
    },
    {
      name: "Computer Science",
      units: 5,
      completed: 2,
      progress: 35,
      nextTopic: "Data Structures",
      color: "primary",
      totalHours: 30,
      hoursCompleted: 11,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-warm/10 to-secondary/10 pb-20 md:pb-8 md:pt-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
              <p className="text-muted-foreground">Track your progress across all subjects</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full">All</Button>
              <Button variant="ghost" className="rounded-full">Pending</Button>
              <Button variant="ghost" className="rounded-full">Completed</Button>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Target className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Units Done</p>
                  <p className="text-2xl font-bold">14/23</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Clock className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Studied</p>
                  <p className="text-2xl font-bold">56h</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warm/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-warm" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <p className="text-2xl font-bold">56%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Course Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course, index) => (
              <Card
                key={index}
                className="p-6 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold text-foreground">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.completed} of {course.units} units completed
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`bg-${course.color}/20 text-${course.color}-foreground border-none`}
                    >
                      {course.progress}%
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={course.progress} className="h-2" />

                  {/* Next Topic */}
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Next Topic</p>
                    <p className="font-medium text-sm">{course.nextTopic}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {course.hoursCompleted}h / {course.totalHours}h
                      </span>
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full">
                      Continue
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
