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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Trash2,
  CalendarIcon,
  Edit,
  Download,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Delete invoice mutation
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

  // Mark as paid mutation
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

  // Filter & sort invoices
  const filteredInvoices = invoices
    .filter((invoice) => {
      const supplier = suppliers.find((s) => s.id === invoice.supplierId);
      const searchString = searchTerm.toLowerCase();

      const matchesSearch =
        searchTerm === "" ||
        (invoice.invoiceNumber?.toLowerCase().includes(searchString)) ||
        (supplier?.name.toLowerCase().includes(searchString)) ||
        invoice.totalAmount.toString().includes(searchString);

      const matchesDateRange =
        (!startDate || new Date(invoice.dueDate) >= startDate) &&
        (!endDate || new Date(invoice.dueDate) <= endDate);

      const matchesStatus = isPaid === undefined || invoice.isPaid === isPaid;

      const matchesAmount =
        (!minAmount || Number(invoice.totalAmount) >= Number(minAmount)) &&
        (!maxAmount || Number(invoice.totalAmount) <= Number(maxAmount));

      return (
        matchesSearch &&
        matchesDateRange &&
        matchesStatus &&
        matchesAmount
      );
    })
    .sort(
      (a, b) =>
        new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );

  // Table columns
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
        const supplier = suppliers.find(
          (s: Supplier) => s.id === invoice.supplierId
        );
        return supplier?.name || "N/A";
      },
    },
    {
      accessorKey: "carrier",
      header: "Carrier",
      cell: ({ row }) => row.original.carrier || "N/A",
    },
    {
      header: "Amount",
      accessorFn: (row: Invoice) => Number(row.totalAmount),
      id: "totalAmount",
      cell: ({ row }) => {
        const invoice = row.original;
        // Safely handle missing totalAmount/currency
        const amount = Number(invoice.totalAmount || 0).toFixed(2);
        const currency = invoice.amountCurrency || "USD";
        // e.g. "$100.00 USD"
        return `$${amount} ${currency}`;
      },
      sortingFn: (rowA, rowB, columnId) =>
        Number(rowB.getValue(columnId)) - Number(rowA.getValue(columnId)),
    },
    {
      accessorKey: "freightCost",
      header: "Freight Cost",
      cell: ({ row }) => {
        const invoice = row.original;
        if (invoice.freightCost == null) {
          return "N/A";
        }
        const cost = Number(invoice.freightCost).toFixed(2);
        const currency = invoice.freightCostCurrency || "USD";
        // e.g. "$10.00 CAD"
        return `$${cost} ${currency}`;
      },
    },
    {
      id: "freightInvoice",
      header: "Freight Invoice",
      cell: ({ row }) => {
        const invoice = row.original;
        if (!invoice.freightInvoiceFile) return null;
        return (
          <a
            href={`/uploads/${encodeURIComponent(invoice.freightInvoiceFile)}`}
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
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) =>
        format(new Date(row.getValue("dueDate")), "MM/dd/yyyy"),
    },
    {
      accessorKey: "isPaid",
      header: "Status",
      cell: ({ row }) => {
        const paid = row.getValue("isPaid") as boolean;
        return (
          <Badge variant={paid ? "default" : "secondary"}>
            {paid ? "Paid" : "Unpaid"}
          </Badge>
        );
      },
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
              onClick={async () => {
                const response = await fetch(
                  `/api/invoices/${invoice.id}`
                );
                const fullInvoice = await response.json();
                setSelectedInvoice(fullInvoice);
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
                    This action cannot be undone. This will permanently
                    delete the invoice.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deleteInvoiceMutation.mutate(invoice.id)
                    }
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
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {/* Search field */}
        <div className="col-span-2">
          <Label>Search</Label>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, supplier, or amount"
          />
        </div>

        {/* Start Date */}
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

        {/* End Date */}
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

        {/* Status */}
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

        {/* Amount Range */}
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

      {/* Export Button */}
      <div className="mb-4">
        <Button variant="outline" onClick={() => {
          if (!filteredInvoices?.length) return;

          const headers = [
            'Invoice #', 'Supplier', 'Carrier', 'Amount', 
            'Freight Cost', 'Due Date', 'Status'
          ];

          const csvData = filteredInvoices.map(invoice => [
            invoice.invoiceNumber,
            suppliers.find(s => s.id === invoice.supplierId)?.name || 'N/A',
            invoice.carrier || 'N/A',
            `$${Number(invoice.totalAmount).toFixed(2)} ${invoice.amountCurrency}`,
            invoice.freightCost ? `$${Number(invoice.freightCost).toFixed(2)} ${invoice.freightCostCurrency}` : 'N/A',
            format(new Date(invoice.dueDate), "MMM d, yyyy"),
            invoice.isPaid ? 'Paid' : 'Unpaid'
          ].join(','));

          const csv = [headers.join(','), ...csvData].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }} className="w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={filteredInvoices} />

      {/* Edit Invoice Dialog */}
      {selectedInvoice && (
        <InvoiceForm
          editInvoice={selectedInvoice}
          onComplete={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
