import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Context
import { AuthProvider, useAuth } from "./lib/auth-context";

// Layouts
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import Landing from "./pages/public/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register"; // Assuming standard implementation based on schema
import DashboardHome from "./pages/dashboard/Home";
import MasterData from "./pages/admin/MasterData";
import FormPeminjaman from "./pages/mahasiswa/Peminjaman";
import VerifikasiPlp from "./pages/plp/Verifikasi";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

// Route Guard
function ProtectedRoute({ component: Component, roles }: { component: any, roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return null; // handled by provider
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Redirect to="/dashboard" />;

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Login} /> {/* Alias for simplicity in generation */}

      {/* Protected - Common */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardHome} />}
      </Route>

      {/* Protected - Admin */}
      <Route path="/admin/master">
        {() => <ProtectedRoute component={MasterData} roles={["admin"]} />}
      </Route>

      {/* Protected - Mahasiswa */}
      <Route path="/mahasiswa/peminjaman">
        {() => <ProtectedRoute component={FormPeminjaman} roles={["mahasiswa"]} />}
      </Route>

      {/* Protected - PLP */}
      <Route path="/plp/verifikasi">
        {() => <ProtectedRoute component={VerifikasiPlp} roles={["plp"]} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
