import { Supplier } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { SupplierView } from "./supplier-view";
import { Edit } from "lucide-react";

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
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSupplier(supplier)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={suppliers}
        defaultSort={[{ id: "outstandingAmount", desc: true }]}
        searchKey="name"
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