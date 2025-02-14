
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CarrierManagementForm } from "./CarrierManagementForm";

interface CarrierCompany {
  id: number;
  name: string;
  contactName: string;
  email: string;
  phone: string;
}

export function CarrierList() {
  const [editingCarrier, setEditingCarrier] = useState<CarrierCompany | null>(null);

  // Sample data - will be replaced with real data later
  const data: CarrierCompany[] = [
    {
      id: 1,
      name: "ABC Trucking",
      contactName: "John Doe",
      email: "john@abctrucking.com",
      phone: "(555) 123-4567"
    },
    {
      id: 2,
      name: "XYZ Transport",
      contactName: "Jane Smith",
      email: "jane@xyztransport.com",
      phone: "(555) 987-6543"
    }
  ];

  const columns: ColumnDef<CarrierCompany>[] = [
    {
      accessorKey: "name",
      header: "Carrier",
    },
    {
      accessorKey: "contactName",
      header: "Contact Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone #",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingCarrier(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this carrier?")) {
                console.log("Delete carrier:", row.original.id);
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Carrier Management</h2>
        <CarrierManagementForm />
      </div>
      {editingCarrier && (
        <CarrierManagementForm
          initialData={editingCarrier}
          open={!!editingCarrier}
          onOpenChange={(open) => !open && setEditingCarrier(null)}
        />
      )}
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
      />
    </div>
  );
}
