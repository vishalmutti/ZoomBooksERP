import { Invoice, Supplier } from "@shared/schema";
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
import { Trash2, CalendarIcon, Edit, Download, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { InvoiceForm } from "./invoice-form";

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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch complete invoice data when an invoice is selected for editing
  const { data: completeInvoiceData, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ["/api/invoices", selectedInvoice?.id],
    queryFn: async () => {
      if (!selectedInvoice?.id) return null;
      console.log('Fetching complete invoice data for ID:', selectedInvoice.id);
      const response = await fetch(`/api/invoices/${selectedInvoice.id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice details');
      const data = await response.json();
      // Ensure items array exists
      return {
        ...data,
        items: data.items || [{
          description: "",
          quantity: "0",
          unitPrice: "0",
          totalPrice: "0",
          invoiceId: data.id
        }]
      };
    },
    enabled: !!selectedInvoice?.id,
    retry: 2
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
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

  const filteredInvoices = invoices.filter(invoice => {
    const supplier = suppliers.find(s => s.id === invoice.supplierId);
    const searchString = searchTerm.toLowerCase();

    const matchesSearch = searchTerm === "" || 
      (invoice.invoiceNumber?.toLowerCase().includes(searchString)) ||
      (supplier?.name.toLowerCase().includes(searchString)) ||
      invoice.totalAmount.toString().includes(searchString);

    const matchesDateRange = (!startDate || new Date(invoice.dueDate) >= startDate) &&
      (!endDate || new Date(invoice.dueDate) <= endDate);

    const matchesStatus = isPaid === undefined || invoice.isPaid === isPaid;

    const matchesAmount = (!minAmount || Number(invoice.totalAmount) >= Number(minAmount)) &&
      (!maxAmount || Number(invoice.totalAmount) <= Number(maxAmount));

    return matchesSearch && matchesDateRange && matchesStatus && matchesAmount;
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
        const supplier = suppliers.find((s: Supplier) => s.id === invoice.supplierId);
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
      accessorKey: "uploadedFile",
      header: "File",
      cell: ({ row }) => {
        const invoice = row.original;
        if (!invoice.uploadedFile) return null;

        return (
          <a
            href={`/uploads/${invoice.uploadedFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            View
          </a>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-2">
            {!invoice.isPaid && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markAsPaidMutation.mutate(invoice.id)}
              >
                Mark as Paid
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInvoice(invoice);
                setEditDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>

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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="col-span-2">
          <Label>Search</Label>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, supplier, or amount"
          />
        </div>

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
          <Label>Amount Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="Min"
              className="w-1/2"
            />
            <Input
              type="number"
              step="0.01"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="Max"
              className="w-1/2"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredInvoices}
      />

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          {isLoadingInvoice ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : completeInvoiceData ? (
            <InvoiceForm 
              editInvoice={completeInvoiceData} 
              onComplete={() => {
                setEditDialogOpen(false);
                setSelectedInvoice(null);
              }} 
            />
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Failed to load invoice data
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}