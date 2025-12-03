import { Link, useLocation } from "wouter";
import { 
  ChartLine, 
  Home, 
  MessageSquare, 
  Users, 
  ExternalLink, 
  Settings, 
  User,
  Activity,
  Zap,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();

  const navigationItems = [
    { id: "dashboard", label: "New Search", icon: Search, path: "/" },
    { id: "results", label: "Analysis Results", icon: ChartLine, path: "/results" },
    { id: "competitors", label: "Competitors", icon: Users, path: "/competitors" },
    { id: "sources", label: "Sources", icon: ExternalLink, path: "/sources" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-screen shadow-sm z-10">
      {/* Logo & Title */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center ring-1 ring-primary/20">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">BrandTracker</h1>
            <p className="text-xs text-muted-foreground font-medium">AI-Powered Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.id} href={item.path}>
              <a className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl w-full text-left transition-all duration-200 group",
                isActive 
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary/20' 
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}

        <div className="mt-8 px-4">
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-sm font-medium text-foreground">System Online</span>
            </div>
            <p className="text-xs text-muted-foreground">
              OpenRouter AI active &<br/>Scraping engine ready
            </p>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50 bg-secondary/10">
        <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">Pro Plan Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
