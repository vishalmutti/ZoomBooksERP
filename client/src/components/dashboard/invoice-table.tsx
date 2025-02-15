
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

export default function InvoiceTable({ invoices: initialInvoices }: { invoices: Invoice[] }) {
  const { toast } = useToast();
  
  // Add real-time query for invoices data
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Carrier</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Freight Cost</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(invoices || []).map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>{invoice.clientName}</TableCell>
            <TableCell>{invoice.carrier || 'N/A'}</TableCell>
            <TableCell>{invoice.currency === 'CAD' ? 'C' : '$'}{invoice.totalAmount.toString()}</TableCell>
            <TableCell>{invoice.freightCost ? `${invoice.freightCostCurrency === 'CAD' ? 'C' : '$'}${invoice.freightCost}` : 'N/A'}</TableCell>
            <TableCell>{format(new Date(invoice.dueDate), "MMM d, yyyy")}</TableCell>
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
  );
}
