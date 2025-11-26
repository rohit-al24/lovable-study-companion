import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  Bell,
  Calendar,
  Moon,
  Download,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const Settings = () => {
  const settingSections = [
    {
      title: "Profile",
      icon: User,
      items: [
        { label: "Name", value: "Alex Johnson", type: "input" },
        { label: "College", value: "University of Example", type: "input" },
        { label: "Semester", value: "3", type: "input" },
      ],
    },
    {
      title: "Preferences",
      icon: Sparkles,
      items: [
        { label: "Study hours per day", value: "4 hours", type: "select" },
        { label: "Keep Sundays free", value: true, type: "toggle" },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        { label: "Study reminders", value: true, type: "toggle" },
        { label: "Progress updates", value: true, type: "toggle" },
        { label: "Exam alerts", value: true, type: "toggle" },
      ],
    },
    {
      title: "AI Personality",
      icon: Sparkles,
      items: [
        { label: "Tone", value: "Friendly", type: "select" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-warm/10 to-secondary/10 pb-20 md:pb-8 md:pt-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          {/* Profile Card */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 bg-gradient-hero">
                <span className="text-2xl text-white font-medium">AJ</span>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">Alex Johnson</h3>
                <p className="text-muted-foreground">alex@example.com</p>
              </div>
              <Button variant="outline" className="rounded-full">
                Edit Profile
              </Button>
            </div>
          </Card>

          {/* Settings Sections */}
          {settingSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <Card key={sectionIndex} className="p-6 shadow-card space-y-6">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center justify-between py-2"
                    >
                      <Label className="text-sm font-medium">{item.label}</Label>

                      {item.type === "toggle" && (
                        <Switch defaultChecked={item.value as boolean} />
                      )}

                      {item.type === "input" && (
                        <Input
                          defaultValue={item.value as string}
                          className="max-w-xs rounded-xl"
                        />
                      )}

                      {item.type === "select" && (
                        <Button variant="ghost" className="gap-2">
                          <span className="text-muted-foreground">{item.value as string}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {/* Additional Options */}
          <Card className="p-6 shadow-card space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              Calendar Sync
            </h2>
            <Button variant="outline" className="w-full rounded-full">
              Connect Google Calendar
            </Button>
          </Card>

          <Card className="p-6 shadow-card space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              Data Export
            </h2>
            <Button variant="outline" className="w-full rounded-full">
              Download My Data
            </Button>
          </Card>

          {/* Theme Toggle */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-sm font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle dark theme</p>
                </div>
              </div>
              <Switch />
            </div>
          </Card>

          {/* Logout */}
          <Button
            variant="outline"
            className="w-full rounded-full text-destructive border-destructive/50 hover:bg-destructive/10"
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
