import { useQuery, useMutation } from "@tanstack/react-query";
import { Supplier } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { SupplierForm } from "@/components/dashboard/supplier-form";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SupplierView } from "@/components/dashboard/supplier-view";

export default function SuppliersPage() {
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  const { data: suppliers = [] } = useQuery<(Supplier & { outstandingAmount: string })[]>({
    queryKey: ["/api/suppliers"],
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
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
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the supplier and might affect related invoices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteSupplierMutation.mutate(supplier.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
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
        onRowClick={(row) => setSelectedSupplier(row.original)}
      />

      <SupplierForm
        open={showAddSupplier}
        onOpenChange={setShowAddSupplier}
      />

      {selectedSupplier && (
        <Dialog open={!!selectedSupplier} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <SupplierView supplier={selectedSupplier} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}