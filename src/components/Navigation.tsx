import { NavLink } from "@/components/NavLink";
import { Home, BookOpen, MessageCircle, Calendar, Settings } from "lucide-react";

const Navigation = () => {
  const navItems = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/courses", icon: BookOpen, label: "Courses" },
    { to: "/chat", icon: MessageCircle, label: "Chat" },
    { to: "/schedule", icon: Calendar, label: "Schedule" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-soft md:top-0 md:bottom-auto z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around md:justify-start md:gap-1 h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col md:flex-row items-center gap-1 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              activeClassName="text-primary bg-primary/10 font-medium"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs md:text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
