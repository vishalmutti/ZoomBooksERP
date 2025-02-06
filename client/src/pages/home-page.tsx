import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import InvoiceTable from "@/components/dashboard/invoice-table";
import ARChart from "@/components/dashboard/ar-chart";
import ARSummary from "@/components/dashboard/ar-summary";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";

export default function HomePage() {
  const { logoutMutation, user } = useAuth();
  const { data: invoices = [] } = useQuery<Invoice[]>({ 
    queryKey: ["/api/invoices"]
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold">Zoom Books AR Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-8">
          <ARSummary invoices={invoices} />
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-card rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">AR Aging</h2>
              <ARChart invoices={invoices} />
            </div>

            <div className="p-6 bg-card rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Invoice Management</h2>
              <InvoiceTable invoices={invoices} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
