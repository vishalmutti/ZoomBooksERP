import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useWholesaleContext } from "./WholesaleContext";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface EnhancedInvoice {
  id: number;
  invoiceNumber: string | null;
  carrier: string | null;
  totalAmount: string;
  freightCost: string | null;
  freightCostCurrency?: string;
  freightInvoiceFile?: string | null;
  dueDate: string;
  isPaid: boolean;
  supplierId: number | null;
  supplierName: string; // enhanced field
  // plus any additional fields from Invoice...
}

interface InvoiceTableProps {
  invoices: EnhancedInvoice[];
}

export default function InvoiceTable({
  invoices: enhancedInvoices,
}: InvoiceTableProps) {
  const { toast } = useToast();
  const { selectedSupplier, timeFilter, fromMetrics, setSelectedSupplier } = useWholesaleContext();
  
  // State for date filtering
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");

  // Use the passed enhancedInvoices directly instead of refetching
  const invoices = enhancedInvoices;

  // Apply filters from metrics when navigating from metrics view
  useEffect(() => {
    if (fromMetrics && selectedSupplier) {
      setSupplierFilter(selectedSupplier);
      
      // Calculate date range based on timeFilter
      const now = new Date();
      let calcStart = new Date();
      if (timeFilter === 'all') {
        calcStart = new Date(2000, 0, 1);
      } else {
        const days = parseInt(timeFilter);
        calcStart.setDate(calcStart.getDate() - days);
      }
      setStartDate(calcStart.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  }, [fromMetrics, selectedSupplier, timeFilter]);

  // Reset filters when clearing the "from metrics" view
  useEffect(() => {
    if (!fromMetrics && selectedSupplier) {
      setSelectedSupplier(null);
    }
  }, [fromMetrics, selectedSupplier, setSelectedSupplier]);

  // Filter invoices based on supplier and date range
  const filteredInvoices = invoices.filter(invoice => {
    const supplierMatch = supplierFilter === "ALL" || 
      (invoice.supplierId !== null && invoice.supplierId.toString() === supplierFilter);
    
    let dateMatch = true;
    if (startDate && endDate) {
      const invoiceDate = new Date(invoice.dueDate);
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);
      dateMatch = invoiceDate >= filterStartDate && invoiceDate <= filterEndDate;
    }
    return supplierMatch && dateMatch;
  });

  // Get unique suppliers for the supplier filter dropdown
  const uniqueSuppliers = Array.from(
    new Set(invoices.map(invoice => invoice.supplierId).filter((id): id is number => id !== null))
  ).sort((a, b) => a - b);

  return (
    <div>
      <div className="mb-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Invoices</h2>
          <Button variant="outline" onClick={() => {
            if (!invoices?.length) return;
            const headers = [
              'Invoice #', 'Supplier', 'Carrier', 'Amount', 'Freight Cost',
              'Due Date', 'Status'
            ];
            const csvData = filteredInvoices.map(invoice => [
              invoice.invoiceNumber || 'N/A',
              invoice.supplierName,
              invoice.carrier || 'N/A',
              `$${Number(invoice.totalAmount).toFixed(2)} ${invoice.totalAmount ? invoice.totalAmount : ""}`,
              invoice.freightCost ? `$${Number(invoice.freightCost).toFixed(2)} ${invoice.freightCostCurrency || ""}` : 'N/A',
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
          }}>
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
                {uniqueSuppliers.map(supplierId => {
                  const name = invoices.find(inv => inv.supplierId === supplierId)?.supplierName || `Supplier ${supplierId}`;
                  return (
                    <SelectItem key={supplierId} value={supplierId.toString()}>
                      {name}
                    </SelectItem>
                  );
                })}
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
            <TableHead>Supplier</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Freight Cost</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(filteredInvoices || []).map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.invoiceNumber || "N/A"}</TableCell>
              <TableCell>{invoice.supplierName}</TableCell>
              <TableCell>{invoice.carrier || "N/A"}</TableCell>
              <TableCell>
                {`$${Number(invoice.totalAmount).toFixed(2)}`}
              </TableCell>
              <TableCell>
                {invoice.freightCost != null
                  ? `$${Number(invoice.freightCost).toFixed(2)} ${invoice.freightCostCurrency || ""}`
                  : "N/A"}
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
                    onClick={() => {}}
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
