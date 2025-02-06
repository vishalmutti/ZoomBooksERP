import { useQuery } from "@tanstack/react-query";
import { Supplier } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SupplierForm } from "@/components/dashboard/supplier-form";
import { useState } from "react";

export default function SuppliersPage() {
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

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
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Button onClick={() => setShowAddSupplier(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        searchKey="name"
      />

      <SupplierForm
        open={showAddSupplier}
        onOpenChange={setShowAddSupplier}
      />
    </div>
  );
}
