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
  Sun,
  Menu,
  X,
  KeyRound
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useRoleStore } from "@/hooks/useRoleStore";
import { useApprovalStore } from "@/hooks/useApprovalStore";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

const allNavItems = [
  { id: 'home', title: "Home", url: "/", icon: Home },
  { id: 'data-studio', title: "Data Studio", url: "/upload", icon: Sparkles },
  { id: 'templates', title: "Templates", url: "/templates", icon: FileSpreadsheet },
  { id: 'datasets', title: "Datasets", url: "/datasets", icon: Database },
  { id: 'actions', title: "Actions", url: "/actions", icon: Settings },
  { id: 'documentation', title: "Documentation", url: "/docs", icon: BookOpen },
  { id: 'approvals', title: "Approvals", url: "/approvals", icon: ClipboardCheck },
  { id: 'access', title: "Access", url: "/access", icon: KeyRound },
  { id: 'admin', title: "Admin", url: "/admin", icon: Shield },
];

const roleLabels: Record<UserRole, string> = {
  user: 'User',
  approver: 'Approver',
  sys_admin: 'Sys Admin',
  role_admin: 'Role Admin',
  super_admin: 'Super Admin',
};
const formatRole = (role: UserRole) => roleLabels[role] ?? role.replace(/_/g, ' ');

interface AppSidebarProps {
  children: React.ReactNode;
}

export function AppSidebar({ children }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, logout, switchRole } = useAuth();
  const { getVisiblePages } = useRoleStore();
  const { getPendingRequests } = useApprovalStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

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

  // Find current page title for mobile header
  const currentPage = allNavItems.find(item => 
    item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
  );

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Header with Logo */}
      <div className={cn(
        "p-4 border-b flex items-center gap-3",
        !isMobile && collapsed ? "justify-center" : ""
      )}>
        <div className="p-2 rounded-xl gradient-primary shrink-0" data-tour="sidebar-logo">
          <Database className="w-5 h-5 text-primary-foreground" />
        </div>
        {(isMobile || !collapsed) && (
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-bold gradient-text">BYOD</h1>
            <p className="text-[10px] text-muted-foreground truncate">Upload • Manipulate • Process</p>
          </div>
        )}
        {!isMobile && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="h-7 w-7 shrink-0"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>
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
                data-tour={`nav-${item.id}`}
                onClick={() => isMobile && setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted",
                  !isMobile && collapsed && "justify-center px-2"
                )}
                activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {(isMobile || !collapsed) && (
                  <span className="flex-1">{item.title}</span>
                )}
                {item.id === 'approvals' && pendingCount > 0 && (isMobile || !collapsed) && (
                  <Badge variant="secondary" className="h-5 px-1.5 bg-orange-500/20 text-orange-600 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </NavLink>
            </TooltipTrigger>
            {!isMobile && collapsed && (
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
                !isMobile && collapsed && "justify-center px-0"
              )}>
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                {(isMobile || !collapsed) && (
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="text-sm font-medium truncate">{currentUser.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{currentUser.activeRole}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side={!isMobile && collapsed ? "right" : "top"} 
              align={!isMobile && collapsed ? "start" : "center"}
              className="w-56"
            >
              <DropdownMenuItem onClick={() => { navigate("/profile"); isMobile && setMobileOpen(false); }}>
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              {currentUser.roles.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Role</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                        {formatRole(currentUser.activeRole)}
                      </Badge>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="bg-popover border border-border shadow-lg z-50">
                        <DropdownMenuRadioGroup
                          value={currentUser.activeRole}
                          onValueChange={(value) => switchRole(value as UserRole)}
                        >
                          {currentUser.roles.map((role) => (
                            <DropdownMenuRadioItem key={role} value={role}>
                              {formatRole(role)}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
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
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "sticky top-0 h-screen bg-card border-r flex-col transition-all duration-300 z-40 hidden md:flex",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Header + Sheet */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center gap-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col [&>button]:hidden">
              {sidebarContent(true)}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg gradient-primary shrink-0">
              <Database className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm truncate">{currentPage?.title || "BYOD"}</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
