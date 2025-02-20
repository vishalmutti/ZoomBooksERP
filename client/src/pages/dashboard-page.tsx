
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";
import { AROverview } from "@/components/dashboard/ar-overview";
import { InvoiceList } from "@/components/dashboard/invoice-list";
import { InvoiceForm } from "@/components/dashboard/invoice-form";
import { SupplierList } from "@/components/dashboard/supplier-list";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { SupplierForm } from "@/components/dashboard/supplier-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { logoutMutation } = useAuth();
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    refetchInterval: 2000,
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<(Supplier & { outstandingAmount: string })[]>({
    queryKey: ["/api/suppliers"],
  });

  const isLoading = invoicesLoading || suppliersLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-center flex-grow">Financial Management Dashboard</h1>
          <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="ar" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ar">Accounts Receivable</TabsTrigger>
            <TabsTrigger value="wholesale">Wholesale Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="ar" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold"></h2>
              <InvoiceForm />
            </div>

            <AROverview invoices={invoices} />

            <div>
              <h3 className="text-xl font-semibold mb-4">Invoices</h3>
              <InvoiceList invoices={invoices} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Suppliers</h3>
                <Button onClick={() => setShowAddSupplier(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
              <SupplierList suppliers={suppliers} />
              <SupplierForm
                open={showAddSupplier}
                onOpenChange={setShowAddSupplier}
              />
            </div>
          </TabsContent>

          <TabsContent value="wholesale" className="space-y-4">
            <div className="grid gap-4">
              <h2 className="text-2xl font-bold">Wholesale Metrics</h2>
              <p className="text-muted-foreground">Coming soon - Wholesale performance metrics and analytics</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
