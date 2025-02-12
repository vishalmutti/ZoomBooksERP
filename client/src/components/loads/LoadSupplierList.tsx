
import { Supplier } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { LoadSupplierView } from "./LoadSupplierView";

interface LoadSupplierListProps {
  suppliers: Supplier[];
}

export function LoadSupplierList({ suppliers }: LoadSupplierListProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const columns: ColumnDef<Supplier>[] = [
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
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={suppliers}
        searchKey="name"
        onRowClick={(row) => setSelectedSupplier(row.original)}
      />

      {selectedSupplier && (
        <LoadSupplierView
          supplier={selectedSupplier}
          open={!!selectedSupplier}
          onOpenChange={(open) => !open && setSelectedSupplier(null)}
        />
      )}
    </div>
  );
}
