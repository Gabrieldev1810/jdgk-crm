import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { auth } from "@/services";
import type { User } from "@/services";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AgentDashboard from "./pages/AgentDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import Accounts from "./pages/Accounts";
import CallCenter from "./pages/CallCenter";
import Dispositions from "./pages/Dispositions";
import UploadData from "./pages/UploadData";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import ThreeCXStatus from "./pages/integrations/ThreeCXStatus";
import DatabaseIntegration from "./pages/integrations/Database";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Initialize authentication state with timeout
    const initAuth = async () => {
      const timeoutId = setTimeout(() => {
        console.warn('Auth initialization timed out, proceeding with no user');
        setIsLoading(false);
      }, 5000); // 5 second timeout

      try {
        if (auth.isAuthenticated()) {
          const currentUser = await auth.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        auth.logout(); // Clear invalid auth state
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const unsubscribe = auth.onAuthChange((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);
  
  const handleLogin = (user: User) => {
    setUser(user);
  };
  
  const handleLogout = async () => {
    try {
      await auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear local state even if API call fails
      setUser(null);
    }
  };

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading Dial-Craft CRM...</p>
        <small className="text-xs text-muted-foreground mt-2">Checking authentication status</small>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="securecall-crm-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {!user ? (
              <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            ) : (
              <AppLayout 
                userEmail={user.email} 
                userRole={user.role} 
                onLogout={handleLogout}
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard userRole={user.role} />} />
                  <Route path="/agent-dashboard" element={<AgentDashboard />} />
                  <Route path="/manager-dashboard" element={<ManagerDashboard />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/calls" element={<CallCenter />} />
                  <Route path="/dispositions" element={<Dispositions />} />
                  <Route path="/upload" element={<UploadData />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/role-management" element={<RoleManagement />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/integrations/3cx" element={<ThreeCXStatus />} />
                  <Route path="/integrations/database" element={<DatabaseIntegration />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            )}
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
