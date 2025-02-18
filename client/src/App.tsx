import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import SuppliersPage from "@/pages/suppliers-page";
import HomePage from "@/pages/home-page";
import { LoadsPage } from "@/pages/LoadsPage";
import CarrierPage from "@/pages/carrier-page";
import { ProtectedRoute } from "./lib/protected-route";
import { Navbar } from "@/components/dashboard/navbar";
import PayrollPage from "@/pages/payroll-page";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />

      <Route path="/dashboard">
        <AppLayout>
          <ProtectedRoute path="/dashboard" component={DashboardPage} />
        </AppLayout>
      </Route>

      <Route path="/suppliers">
        <AppLayout>
          <ProtectedRoute path="/suppliers" component={SuppliersPage} />
        </AppLayout>
      </Route>

      <Route path="/loads">
        <AppLayout>
          <ProtectedRoute path="/loads" component={LoadsPage} />
        </AppLayout>
      </Route>

      <Route path="/carrier">
        <AppLayout>
          <ProtectedRoute path="/carrier" component={CarrierPage} />
        </AppLayout>
      </Route>

      <Route path="/payroll">
        <AppLayout>
          <ProtectedRoute path="/payroll" component={PayrollPage} />
        </AppLayout>
      </Route>

      <Route path="/">
        <AppLayout>
          <ProtectedRoute path="/" component={HomePage} />
        </AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;