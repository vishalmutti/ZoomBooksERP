
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CarrierManagementForm } from "./CarrierManagementForm";
import { CarrierView } from "./CarrierView";

interface CarrierCompany {
  id: number;
  name: string;
  contactName: string;
  email: string;
  phone: string;
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function CarrierList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCarrier, setEditingCarrier] = useState<CarrierCompany | null>(null);
  const [viewingCarrier, setViewingCarrier] = useState<CarrierCompany | null>(null);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["carriers"],
    queryFn: async () => {
      const response = await fetch("/api/carriers");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch carriers");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/carriers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete carrier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      toast({
        title: "Success",
        description: "Carrier deleted successfully",
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

  const columns: ColumnDef<CarrierCompany>[] = [
    {
      accessorKey: "name",
      header: "Carrier",
      cell: ({ row }) => (
        <Button
          variant="link"
          onClick={() => setViewingCarrier(row.original)}
        >
          {row.getValue("name")}
        </Button>
      ),
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
      {viewingCarrier && (
        <CarrierView
          carrier={viewingCarrier}
          open={!!viewingCarrier}
          onOpenChange={(open) => !open && setViewingCarrier(null)}
        />
      )}
    </div>
  );
}
