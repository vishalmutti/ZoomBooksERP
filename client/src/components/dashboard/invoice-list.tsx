import { Invoice } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, CalendarIcon, PlusCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface InvoiceListProps {
  invoices: Invoice[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isPaid, setIsPaid] = useState<boolean | undefined>(undefined);
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/invoices", selectedInvoiceId, "payments"],
    queryFn: async () => {
      if (!selectedInvoiceId) return [];
      const res = await fetch(`/api/invoices/${selectedInvoiceId}/payments`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!selectedInvoiceId,
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/invoices/${id}/mark-paid`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, amount, paymentMethod }: { invoiceId: number; amount: string; paymentMethod: string }) => {
      const res = await apiRequest("POST", `/api/invoices/${invoiceId}/payments`, {
        amount,
        paymentMethod,
        paymentDate: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", selectedInvoiceId, "payments"] });
      toast({
        title: "Success",
        description: "Payment added successfully",
      });
      setSelectedInvoiceId(null);
    },
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
    },
    {
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => {
        const invoice = row.original;
        const supplier = suppliers.find((s: { id: number }) => s.id === invoice.supplierId);
        return supplier?.name || "N/A";
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => `$${Number(row.getValue("totalAmount")).toFixed(2)}`,
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => format(new Date(row.getValue("dueDate")), "MM/dd/yyyy"),
    },
    {
      accessorKey: "isPaid",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isPaid") ? "default" : "secondary"}>
          {row.getValue("isPaid") ? "Paid" : "Unpaid"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-2">
            {!invoice.isPaid && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                  >
                    Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      addPaymentMutation.mutate({
                        invoiceId: invoice.id,
                        amount: formData.get("amount") as string,
                        paymentMethod: formData.get("paymentMethod") as string,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Input
                        id="paymentMethod"
                        name="paymentMethod"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Payment
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                >
                  View Payments
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Payment History</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">${Number(payment.amount).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.paymentDate), "MM/dd/yyyy")}
                        </p>
                      </div>
                      <Badge>{payment.paymentMethod}</Badge>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the invoice.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteInvoiceMutation.mutate(invoice.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <select
            className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md"
            value={isPaid === undefined ? "" : String(isPaid)}
            onChange={(e) => {
              const value = e.target.value;
              setIsPaid(value === "" ? undefined : value === "true");
            }}
          >
            <option value="">All</option>
            <option value="true">Paid</option>
            <option value="false">Unpaid</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Min Amount</Label>
          <Input
            type="number"
            step="0.01"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="Min amount"
          />
        </div>

        <div className="space-y-2">
          <Label>Max Amount</Label>
          <Input
            type="number"
            step="0.01"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="Max amount"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        searchKey="invoiceNumber"
      />
    </div>
  );
}