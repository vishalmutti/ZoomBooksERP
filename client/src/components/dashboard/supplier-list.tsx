import { Supplier } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { SupplierView } from "./supplier-view";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SupplierListProps {
  suppliers: (Supplier & { outstandingAmount: string })[];
}

export function SupplierList({ suppliers }: SupplierListProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<(Supplier & { outstandingAmount: string }) | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | '14' | '30' | '90'>('all');

  const filterByDate = (date: string) => {
    const now = new Date();
    const dueDate = new Date(date);
    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const filterDays = timeFilter === 'all' ? Infinity : Number(timeFilter);
    return daysDiff <= filterDays;
  };

  const columns: ColumnDef<Supplier & { outstandingAmount: string }>[] = [
    {
      accessorKey: "timeFilter",
      header: "Time Period",
      cell: () => (
        <Select value={timeFilter} onValueChange={(value: 'all' | '14' | '30' | '90') => setTimeFilter(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="14">Last 14 Days</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "contactPerson",
      header: "Contact Person",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "address",
      header: "Address",
    },
    {
      accessorKey: "totalRevenue",
      header: "Total Revenue",
      cell: ({ row }) => {
        const invoices = row.original.invoices || [];
        const total = invoices
          .filter(inv => filterByDate(inv.dueDate))
          .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        return (
          <Badge variant="secondary">
            ${total.toFixed(2)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "outstandingAmount",
      header: "Outstanding Amount",
      cell: ({ row }) => {
        const invoices = row.original.invoices || [];
        const amount = invoices
          .filter(inv => !inv.isPaid && filterByDate(inv.dueDate))
          .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        return (
          <Badge variant={amount > 0 ? "destructive" : "default"}>
            ${amount.toFixed(2)}
          </Badge>
        );
      },
      sortingFn: (rowA, rowB) => {
        return Number(rowB.original.outstandingAmount) - Number(rowA.original.outstandingAmount);
      },
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={suppliers}
        defaultSort={[{ id: "outstandingAmount", desc: true }]}
        searchKey="name"
        onRowClick={(row) => setSelectedSupplier(row.original)}
      />

      {selectedSupplier && (
        <SupplierView
          supplier={selectedSupplier}
          open={!!selectedSupplier}
          onOpenChange={(open) => !open && setSelectedSupplier(null)}
        />
      )}
    </div>
  );
}