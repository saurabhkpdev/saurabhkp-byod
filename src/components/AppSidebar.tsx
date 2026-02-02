import { useState } from "react";
import { 
  Home, 
  Sparkles, 
  BookOpen, 
  Shield, 
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  LogOut,
  User
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Data Studio", url: "/upload", icon: Sparkles },
  { title: "Templates", url: "/templates", icon: FileSpreadsheet },
  { title: "Documentation", url: "/docs", icon: BookOpen },
  { title: "Admin", url: "/admin", icon: Shield },
];

interface AppSidebarProps {
  children: React.ReactNode;
}

export function AppSidebar({ children }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside 
        className={cn(
          "sticky top-0 h-screen bg-card border-r flex flex-col transition-all duration-300 z-40",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "p-4 border-b flex items-center gap-3",
          collapsed ? "justify-center" : ""
        )}>
          <div className="p-2 rounded-xl gradient-primary shrink-0">
            <Database className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold gradient-text">BYOD</h1>
              <p className="text-[10px] text-muted-foreground truncate">Upload • Manipulate • Process</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Tooltip key={item.url} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    "text-muted-foreground hover:text-foreground hover:bg-muted",
                    collapsed && "justify-center px-2"
                  )}
                  activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  {item.title}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* Footer with User, Theme Toggle and Collapse */}
        <div className="p-3 border-t space-y-2">
          {/* Current User */}
          {currentUser && (
            <div className={cn(
              "flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/50",
              collapsed && "justify-center px-0"
            )}>
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{currentUser.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <div className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "justify-between px-2"
          )}>
            {!collapsed && (
              <span className="text-xs text-muted-foreground">Theme</span>
            )}
            <ThemeToggle size="sm" />
          </div>

          {/* Logout Button */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={cn(
                  "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                  collapsed ? "justify-center" : "justify-start"
                )}
              >
                <LogOut className="w-4 h-4" />
                {!collapsed && <span className="ml-2">Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                Logout
              </TooltipContent>
            )}
          </Tooltip>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full justify-center",
              !collapsed && "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
