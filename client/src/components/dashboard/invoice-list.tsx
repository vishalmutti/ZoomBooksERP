import { Invoice } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface InvoiceListProps {
  invoices: Invoice[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const { toast } = useToast();

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

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "clientName",
      header: "Client",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `$${Number(row.getValue("amount")).toFixed(2)}`,
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAsPaidMutation.mutate(invoice.id)}
            disabled={invoice.isPaid || markAsPaidMutation.isPending}
          >
            Mark as Paid
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={invoices}
      searchKey="clientName"
    />
  );
}
