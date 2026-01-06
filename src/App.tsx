import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import DataUpload from "./pages/DataUpload";
import Documentation from "./pages/Documentation";
import Admin from "./pages/Admin";
import TemplateLibrary from "./pages/TemplateLibrary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppSidebar>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/upload" element={<DataUpload />} />
                <Route path="/templates" element={<TemplateLibrary />} />
                <Route path="/docs" element={<Documentation />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppSidebar>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
