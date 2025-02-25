import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Invoice } from "@shared/schema";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWholesaleContext } from "./WholesaleContext";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function InvoiceTable({
  invoices: initialInvoices,
}: {
  invoices: Invoice[];
}) {
  const { toast } = useToast();
  const { selectedSupplier, timeFilter, fromMetrics, setSelectedSupplier } = useWholesaleContext();
  
  // State for date filtering
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");

  // Real-time query for invoices data
  const { data: invoices = initialInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    initialData: initialInvoices,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 2000, // Consider data fresh for 2 seconds
  });

  // Apply filters from metrics when navigating from metrics view
  useEffect(() => {
    if (fromMetrics && selectedSupplier) {
      setSupplierFilter(selectedSupplier);
      
      // Calculate date range based on timeFilter
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeFilter === 'all') {
        // Set to a date far in the past for "all time"
        startDate = new Date(2000, 0, 1);
      } else {
        // Subtract days based on timeFilter
        const days = parseInt(timeFilter);
        startDate.setDate(startDate.getDate() - days);
      }
      
      setStartDate(startDate.toISOString().split('T')[0]);
      setEndDate(endDate.toISOString().split('T')[0]);
    }
  }, [fromMetrics, selectedSupplier, timeFilter]);

  // Reset filters when clearing the "from metrics" view
  useEffect(() => {
    if (!fromMetrics && selectedSupplier) {
      setSelectedSupplier(null);
    }
  }, [fromMetrics, selectedSupplier, setSelectedSupplier]);

  const markPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/invoices/${id}/mark-paid`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice marked as paid",
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

  const exportToCSV = () => {
    if (!invoices?.length) return;

    const headers = [
      'Invoice #', 'Carrier', 'Amount', 'Freight Cost',
      'Due Date', 'Status'
    ];

    const csvData = invoices.map(invoice => [
      invoice.invoiceNumber || 'N/A',
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
  };

  // Filter invoices based on supplier and date range
  const filteredInvoices = invoices.filter(invoice => {
    // Apply supplier filter
    const supplierMatch = supplierFilter === "ALL" || 
      (invoice.supplierId !== null && invoice.supplierId.toString() === supplierFilter);
    
    // Apply date range filter
    let dateMatch = true;
    if (startDate && endDate) {
      const invoiceDate = new Date(invoice.dueDate);
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);
      
      // Set end date to end of day for inclusive comparison
      filterEndDate.setHours(23, 59, 59, 999);
      
      dateMatch = invoiceDate >= filterStartDate && invoiceDate <= filterEndDate;
    }
    
    // Return true only if all filters match
    return supplierMatch && dateMatch;
  });

  // Get unique suppliers for the filter dropdown
  const uniqueSuppliers = Array.from(
    new Set(invoices.map(invoice => invoice.supplierId).filter(id => id !== null))
  ).sort();

  return (
    <div>
      <div className="mb-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Invoices</h2>
          <Button variant="outline" onClick={exportToCSV}>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Supplier</label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Suppliers</SelectItem>
                {uniqueSuppliers.map(supplierId => (
                  <SelectItem key={supplierId} value={supplierId.toString()}>
                    {`Supplier ${supplierId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Freight Cost</TableHead>
            <TableHead>Freight Invoice</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(filteredInvoices || []).map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.invoiceNumber || "N/A"}</TableCell>
              <TableCell>{invoice.carrier || "N/A"}</TableCell>

              {/* Amount in the format "$100.00 USD" or "$100.00 CAD" */}
              <TableCell>
                {`$${Number(invoice.totalAmount).toFixed(2)} ${invoice.amountCurrency}`}
              </TableCell>

              {/* Freight cost in the same format, or "N/A" if not present */}
              <TableCell>
                {invoice.freightCost != null
                  ? `$${Number(invoice.freightCost).toFixed(2)} ${
                      invoice.freightCostCurrency
                    }`
                  : "N/A"}
              </TableCell>

              <TableCell>
                {invoice.freightInvoiceFile ? (
                  <a
                    href={`/uploads/${encodeURIComponent(invoice.freightInvoiceFile)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
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
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    View
                  </a>
                ) : (
                  "N/A"
                )}
              </TableCell>

              <TableCell>
                {format(new Date(invoice.dueDate), "MMM d, yyyy")}
              </TableCell>

              <TableCell>
                {invoice.isPaid ? (
                  <span className="text-green-600">Paid</span>
                ) : (
                  <span className="text-red-600">Unpaid</span>
                )}
              </TableCell>

              <TableCell>
                {!invoice.isPaid && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markPaidMutation.mutate(invoice.id)}
                    disabled={markPaidMutation.isPending}
                  >
                    Mark Paid
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
