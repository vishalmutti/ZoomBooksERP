import { Supplier, Invoice } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SupplierViewProps {
  supplier: Supplier & { outstandingAmount: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierView({ supplier, open, onOpenChange }: SupplierViewProps) {
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/suppliers", supplier.id, "invoices"],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${supplier.id}/invoices`);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
  });

  const unpaidInvoices = invoices.filter(invoice => !invoice.isPaid);
  const paidInvoices = invoices.filter(invoice => invoice.isPaid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{supplier.name}</span>
            <Badge variant={Number(supplier.outstandingAmount) > 0 ? "destructive" : "default"}>
              Outstanding: ${Number(supplier.outstandingAmount).toFixed(2)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Contact Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Contact Person:</span> {supplier.contactPerson || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {supplier.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {supplier.phone || 'N/A'}</p>
                <p><span className="font-medium">Address:</span> {supplier.address || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Invoice Summary</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Total Outstanding:</span>{" "}
                  <Badge variant="destructive">${Number(supplier.outstandingAmount).toFixed(2)}</Badge>
                </p>
                <p><span className="font-medium">Unpaid Invoices:</span> {unpaidInvoices.length}</p>
                <p><span className="font-medium">Paid Invoices:</span> {paidInvoices.length}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Invoice History</h3>
            <ScrollArea className="h-[400px] pr-4">
              {unpaidInvoices.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-destructive">Outstanding Invoices</h4>
                  {unpaidInvoices.map((invoice) => (
                    <Card key={invoice.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {invoice.invoiceNumber || `Invoice #${invoice.id}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(invoice.dueDate), "PPP")}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          ${Number(invoice.totalAmount).toFixed(2)}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {paidInvoices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground">Paid Invoices</h4>
                  {paidInvoices.map((invoice) => (
                    <Card key={invoice.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {invoice.invoiceNumber || `Invoice #${invoice.id}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Paid: {invoice.paymentDate ? format(new Date(invoice.paymentDate), "PPP") : "N/A"}
                          </p>
                        </div>
                        <Badge variant="default">
                          ${Number(invoice.totalAmount).toFixed(2)}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}