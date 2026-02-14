import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRoleStore } from "@/hooks/useRoleStore";
import Index from "./pages/Index";
import DataUpload from "./pages/DataUpload";
import Documentation from "./pages/Documentation";
import Admin from "./pages/Admin";
import TemplateLibrary from "./pages/TemplateLibrary";
import Approvals from "./pages/Approvals";
import ActionsConfigPage from "./pages/ActionsConfig";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import { GenieChat } from "./components/GenieChat";

const queryClient = new QueryClient();

// Protected route wrapper with role-based access
const ProtectedRoute = ({ children, path }: { children: React.ReactNode; path: string }) => {
  const { currentUser } = useAuth();
  const { canAccessPage } = useRoleStore();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  const userRole = currentUser.activeRole;
  if (!canAccessPage(userRole, path)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser, setCurrentUser } = useAuth();

  // Listen for Supabase auth state changes (Google OAuth)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && !currentUser) {
          const meta = session.user.user_metadata;
          setCurrentUser({
            id: session.user.id,
            username: meta?.full_name || meta?.name || session.user.email || 'User',
            roles: ['user'],
            activeRole: 'user',
            createdAt: session.user.created_at,
          });
        } else if (!session && currentUser) {
          // Session ended externally
        }
      }
    );

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !currentUser) {
        const meta = session.user.user_metadata;
        setCurrentUser({
          id: session.user.id,
          username: meta?.full_name || meta?.name || session.user.email || 'User',
          roles: ['user'],
          activeRole: 'user',
          createdAt: session.user.created_at,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
    <Routes>
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route
        path="/"
        element={
          <ProtectedRoute path="/">
            <AppSidebar>
              <Index />
            </AppSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute path="/upload">
            <AppSidebar>
              <DataUpload />
            </AppSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute path="/templates">
            <AppSidebar>
              <TemplateLibrary />
            </AppSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/docs"
        element={
          <ProtectedRoute path="/docs">
            <AppSidebar>
              <Documentation />
            </AppSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute path="/approvals">
            <AppSidebar>
              <Approvals />
            </AppSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/actions"
        element={
          <ProtectedRoute path="/actions">
            <AppSidebar>
              <ActionsConfigPage />
            </AppSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute path="/admin">
            <AppSidebar>
              <Admin />
            </AppSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute path="/profile">
            <AppSidebar>
              <Profile />
            </AppSidebar>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <GenieChat />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
