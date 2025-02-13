import { Supplier } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { LoadSupplierView } from "./LoadSupplierView";
import { LoadSupplierForm } from "./LoadSupplierForm";
import { Button } from "@/components/ui/button";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface LoadSupplierListProps {
  suppliers: Supplier[];
}

export function LoadSupplierList({ suppliers }: LoadSupplierListProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (supplier: Supplier) => {
    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete supplier');

      await queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    }
    setSelectedSupplier(null);
  };

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
    {
      id: "actions",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setEditingSupplier(supplier);
              }}
            >
              <LuPencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LuTrash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the supplier.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(supplier)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
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

      {editingSupplier && (
        <LoadSupplierForm
          supplier={editingSupplier}
          open={!!editingSupplier}
          onOpenChange={(open) => !open && setEditingSupplier(null)}
        />
      )}
    </div>
  );
}