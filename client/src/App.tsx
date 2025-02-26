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
import ImportantLinksPage from "@/pages/important-links-page";
import { LoadsPage } from "@/pages/LoadsPage";
import CarrierPage from "@/pages/carrier-page";
import { ProtectedRoute } from "./lib/protected-route";
import { Navbar } from "@/components/dashboard/navbar";
import PayrollPage from "@/pages/payroll-page";
import MetricsPage from "@/pages/key-performance-metrics/metrics-page";
import OntarioMetricsPage from "@/pages/key-performance-metrics/ontario-metrics-page";
import BritishColumbiaMetricsPage from "@/pages/key-performance-metrics/british-columbia-metrics-page";
import OntarioStorageUtilizationPage from "@/pages/key-performance-metrics/ontario-storage-utilization-page"; 
import ZoomBookAI from "@/pages/zoom-book-ai";

// Scheduling Pages
import SchedulingDashboard from "@/pages/scheduling/index";
import ScheduleCalendarPage from "@/pages/scheduling/calendar";
import EmployeesPage from "@/pages/scheduling/employees";
import DepartmentsPage from "@/pages/scheduling/departments";
import TimeOffRequestsPage from "@/pages/scheduling/time-off";
import GenerateSchedulePage from "@/pages/scheduling/generate";

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

      {/* Scheduling Routes */}
      <Route path="/scheduling">
        <AppLayout>
          <ProtectedRoute path="/scheduling" component={SchedulingDashboard} />
        </AppLayout>
      </Route>

      <Route path="/scheduling/calendar">
        <AppLayout>
          <ProtectedRoute path="/scheduling/calendar" component={ScheduleCalendarPage} />
        </AppLayout>
      </Route>

      <Route path="/scheduling/employees">
        <AppLayout>
          <ProtectedRoute path="/scheduling/employees" component={EmployeesPage} />
        </AppLayout>
      </Route>

      <Route path="/scheduling/departments">
        <AppLayout>
          <ProtectedRoute path="/scheduling/departments" component={DepartmentsPage} />
        </AppLayout>
      </Route>

      <Route path="/scheduling/time-off">
        <AppLayout>
          <ProtectedRoute path="/scheduling/time-off" component={TimeOffRequestsPage} />
        </AppLayout>
      </Route>

      <Route path="/scheduling/generate">
        <AppLayout>
          <ProtectedRoute path="/scheduling/generate" component={GenerateSchedulePage} />
        </AppLayout>
      </Route>

      <Route path="/metrics">
        <AppLayout>
          <ProtectedRoute path="/metrics" component={MetricsPage} />
        </AppLayout>
      </Route>

      <Route path="/metrics/ontario">
        <AppLayout>
          <ProtectedRoute path="/metrics/ontario" component={OntarioMetricsPage} />
        </AppLayout>
      </Route>

      <Route path="/metrics/british-columbia">
        <AppLayout>
          <ProtectedRoute path="/metrics/british-columbia" component={BritishColumbiaMetricsPage} />
        </AppLayout>
      </Route>

      <Route path="/metrics/ontario/storage">
        <AppLayout>
          <ProtectedRoute path="/metrics/ontario/storage" component={OntarioStorageUtilizationPage} />
        </AppLayout>
      </Route>

      <Route path="/">
        <AppLayout>
          <ProtectedRoute path="/" component={HomePage} />
        </AppLayout>
      </Route>

      <Route path="/important-links">
        <AppLayout>
          <ProtectedRoute path="/important-links" component={ImportantLinksPage} />
        </AppLayout>
      </Route>

      <Route path="/zoom-book-ai">
        <AppLayout>
          <ProtectedRoute path="/zoom-book-ai" component={ZoomBookAI} />
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
