import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadForm } from "./LoadForm";
import { LoadTable } from "./LoadTable";
import type { IncomingLoad, Supplier } from "@shared/schema";
import { LoadSupplierList } from "./LoadSupplierList";
import { LoadSupplierForm } from "./LoadSupplierForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LuPlus } from "react-icons/lu";

export function LoadDashboard() {
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingLoad, setEditingLoad] = useState<IncomingLoad | null>(null);
  const [showAddLoad, setShowAddLoad] = useState(false);

  const { data: loads, isLoading, refetch } = useQuery<IncomingLoad[]>({
    queryKey: ["/api/loads"],
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const filteredLoads = loads?.filter(load => 
    load.loadType === "Incoming"
  );

  const handleEdit = (load: IncomingLoad) => {
    setEditingLoad(load);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/loads/${id}`, { method: 'DELETE' });
      refetch();
    } catch (error) {
      console.error('Failed to delete load:', error);
    }
  };

  const handleClose = () => {
    setEditingLoad(null);
    setShowAddLoad(false);
    refetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Load Management</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage all your loads in one place
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end">
          <LoadForm
            onClose={() => setShowAddLoad(false)}
            defaultType="Incoming"
            show={showAddLoad}
          >
            <Button onClick={() => setShowAddLoad(true)}>
              <LuPlus className="mr-2 h-4 w-4" /> New Load
            </Button>
          </LoadForm>
        </div>
        <LoadTable 
          loads={filteredLoads} 
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          suppliers={suppliers}
        />
      </div>

      {editingLoad && (
        <LoadForm
          initialData={editingLoad}
          onClose={handleClose}
          show={true}
          suppliers={suppliers}
        />
      )}


      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Load Suppliers</h2>
          <button onClick={() => setShowAddSupplier(true)}>Add Supplier</button>
        </div>

        <LoadSupplierList suppliers={suppliers} />

        <LoadSupplierForm
          open={showAddSupplier}
          onOpenChange={setShowAddSupplier}
        />
      </div>
    </div>
  );
}