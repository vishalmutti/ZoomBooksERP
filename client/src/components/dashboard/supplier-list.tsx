import { Supplier } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { SupplierView } from "./supplier-view";

interface SupplierListProps {
  suppliers: (Supplier & { outstandingAmount: string })[];
}

export function SupplierList({ suppliers }: SupplierListProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<(Supplier & { outstandingAmount: string }) | null>(null);

  const columns: ColumnDef<Supplier & { outstandingAmount: string }>[] = [
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
      accessorKey: "outstandingAmount",
      header: "Outstanding Amount",
      cell: ({ row }) => {
        const amount = Number(row.getValue("outstandingAmount"));
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