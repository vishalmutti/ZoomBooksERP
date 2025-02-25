import { useQuery } from "@tanstack/react-query";
import { Invoice, Supplier } from "@shared/schema";
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
import { WholesaleMetrics } from "@/components/dashboard/wholesale-metrics";
import { WholesaleProvider } from "@/components/dashboard/WholesaleContext";
import InvoiceTable from "@/components/dashboard/invoice-table";

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

  // Enhance invoices by mapping each invoice to include supplierName from suppliers data
  const enhancedInvoices = invoices.map((invoice) => {
    const supplier = suppliers.find((s) => s.id === invoice.supplierId);
    return {
      ...invoice,
      supplierName: supplier ? supplier.name : `Supplier ${invoice.supplierId}`,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-left"> {/* Added to left-align the header */}
            <h1 className="text-2xl font-bold">Accounts Receivable Dashboard</h1>
            <p className="text-sm text-gray-600">Manage receivables and wholesale metrics in one place</p>
          </div>
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
            <WholesaleProvider>
              <div className="grid gap-4">
                <h2 className="text-2xl font-bold">Wholesale Metrics</h2>
                <WholesaleMetrics />
                <InvoiceTable invoices={enhancedInvoices} />
              </div>
            </WholesaleProvider>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
