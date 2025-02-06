import { Supplier, Invoice, InsertSupplier, insertSupplierSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
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
  const { toast } = useToast();
  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: supplier,
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const res = await apiRequest("PATCH", `/api/suppliers/${supplier.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const onSubmit = form.handleSubmit((data) => {
    updateSupplierMutation.mutate(data);
  });

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

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Supplier Details</h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input {...form.register("name")} />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input {...form.register("address")} />
              </div>

              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input {...form.register("contactPerson")} />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input type="email" {...form.register("email")} />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input {...form.register("phone")} />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={updateSupplierMutation.isPending}
              >
                {updateSupplierMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Supplier
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Invoice History</h3>
            <ScrollArea className="h-[600px] pr-4">
              {unpaidInvoices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">Unpaid Invoices</h4>
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
                        <p className="font-semibold">
                          ${Number(invoice.totalAmount).toFixed(2)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {paidInvoices.length > 0 && (
                <>
                  <Separator className="my-4" />
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
                          <p className="font-semibold">
                            ${Number(invoice.totalAmount).toFixed(2)}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}