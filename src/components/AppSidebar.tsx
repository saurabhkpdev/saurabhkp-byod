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
  User,
  ClipboardCheck,
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useRoleStore } from "@/hooks/useRoleStore";
import { useApprovalStore } from "@/hooks/useApprovalStore";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

const allNavItems = [
  { id: 'home', title: "Home", url: "/", icon: Home },
  { id: 'data-studio', title: "Data Studio", url: "/upload", icon: Sparkles },
  { id: 'templates', title: "Templates", url: "/templates", icon: FileSpreadsheet },
  { id: 'datasets', title: "Datasets", url: "/datasets", icon: Database },
  { id: 'actions', title: "Actions", url: "/actions", icon: Settings },
  { id: 'documentation', title: "Documentation", url: "/docs", icon: BookOpen },
  { id: 'approvals', title: "Approvals", url: "/approvals", icon: ClipboardCheck },
  { id: 'admin', title: "Admin", url: "/admin", icon: Shield },
];

interface AppSidebarProps {
  children: React.ReactNode;
}

export function AppSidebar({ children }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout, switchRole } = useAuth();
  const { getVisiblePages } = useRoleStore();
  const { getPendingRequests } = useApprovalStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Filter nav items based on user's role permissions
  const userRole = currentUser?.activeRole || 'user';
  const visiblePages = getVisiblePages(userRole);
  const navItems = allNavItems.filter(item => 
    visiblePages.some(page => page.pageId === item.id)
  );

  const pendingCount = getPendingRequests().length;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
        {/* Header with Logo and Collapse */}
        <div className={cn(
          "p-4 border-b flex items-center gap-3",
          collapsed ? "justify-center" : ""
        )}>
          <div className="p-2 rounded-xl gradient-primary shrink-0" data-tour="sidebar-logo">
            <Database className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <h1 className="text-lg font-bold gradient-text">BYOD</h1>
              <p className="text-[10px] text-muted-foreground truncate">Upload • Manipulate • Process</p>
            </div>
          )}
          {/* Collapse Toggle */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="h-7 w-7 shrink-0"
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Tooltip key={item.url} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  data-tour={`nav-${item.id}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    "text-muted-foreground hover:text-foreground hover:bg-muted",
                    collapsed && "justify-center px-2"
                  )}
                  activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1">{item.title}</span>
                  )}
                  {/* Show pending count for approvals */}
                  {item.id === 'approvals' && pendingCount > 0 && !collapsed && (
                    <Badge variant="secondary" className="h-5 px-1.5 bg-orange-500/20 text-orange-600 text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                </NavLink>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.title}
                  {item.id === 'approvals' && pendingCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 bg-orange-500/20 text-orange-600 text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* Footer with User Profile */}
        <div className="p-3 border-t">
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-tour="user-menu" className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors",
                  collapsed && "justify-center px-0"
                )}>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  {!collapsed && (
                    <div className="flex-1 overflow-hidden text-left">
                      <p className="text-sm font-medium truncate">{currentUser.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{currentUser.activeRole}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side={collapsed ? "right" : "top"} 
                align={collapsed ? "start" : "center"}
                className="w-56"
              >
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 mr-2" />
                  ) : (
                    <Moon className="w-4 h-4 mr-2" />
                  )}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                {currentUser.roles.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={currentUser.activeRole}
                      onValueChange={(value) => switchRole(value as UserRole)}
                    >
                      {currentUser.roles.map((role) => (
                        <DropdownMenuRadioItem key={role} value={role} className="capitalize">
                          {role}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
