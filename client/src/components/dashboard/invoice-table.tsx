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

export default function InvoiceTable({
  invoices: initialInvoices,
}: {
  invoices: Invoice[];
}) {
  const { toast } = useToast();

  // Real-time query for invoices data
  const { data: invoices = initialInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    initialData: initialInvoices,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 2000, // Consider data fresh for 2 seconds
  });

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
      'Client', 'Carrier', 'Amount', 'Freight Cost',
      'Due Date', 'Status'
    ];

    const csvData = invoices.map(invoice => [
      invoice.clientName,
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

  return (
    <div>
      <div className="mb-4">
        <Button variant="outline" onClick={exportToCSV} className="w-full">
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
      <Table>
        <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
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
        {(invoices || []).map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>{invoice.clientName}</TableCell>
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
