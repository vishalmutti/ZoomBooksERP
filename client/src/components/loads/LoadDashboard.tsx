import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadForm } from "./LoadForm";
import { LoadTable } from "./LoadTable";
import { Button } from "@/components/ui/button";
import type { IncomingLoad, Supplier } from "@shared/schema";
import { LuPackage2, LuPlus, LuShip, LuStore } from "react-icons/lu";
import { LoadSupplierList } from "./LoadSupplierList";
import { LoadSupplierForm } from "./LoadSupplierForm";

export function LoadDashboard() {
  const [activeTab, setActiveTab] = useState("incoming");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingLoad, setEditingLoad] = useState<IncomingLoad | null>(null);
  const { data: loads, isLoading } = useQuery<IncomingLoad[]>({
    queryKey: ["/api/loads"],
  });
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const filteredLoads = loads?.filter(load => 
    load.loadType?.toLowerCase() === activeTab.toLowerCase()
  );

  const handleEdit = (load: IncomingLoad) => {
    setEditingLoad(load);
  };

  const handleDelete = (loadId: string) => {
    // Implement delete logic here.  This is a placeholder.
    console.log("Deleting load with ID:", loadId);
    // You would typically make an API call to delete the load.
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Load Management</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage all your loads in one place
        </p>
      </div>

      <Tabs defaultValue="incoming" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <LuShip className="h-4 w-4" />
            Incoming
          </TabsTrigger>
          <TabsTrigger value="wholesale" className="flex items-center gap-2">
            <LuStore className="h-4 w-4" />
            Wholesale
          </TabsTrigger>
          <TabsTrigger value="miscellaneous" className="flex items-center gap-2">
            <LuPackage2 className="h-4 w-4" />
            Miscellaneous
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          <div className="flex justify-end">
            <LoadForm defaultType="Incoming" />
          </div>
          <LoadTable 
            loads={filteredLoads} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {editingLoad && (
            <LoadForm
              initialData={editingLoad}
              onClose={() => setEditingLoad(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="wholesale" className="space-y-4">
          <div className="flex justify-end">
            <LoadForm defaultType="Wholesale" />
          </div>
          <LoadTable 
            loads={filteredLoads} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {editingLoad && (
            <LoadForm
              initialData={editingLoad}
              onClose={() => setEditingLoad(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="miscellaneous" className="space-y-4">
          <div className="flex justify-end">
            <LoadForm defaultType="Miscellaneous" />
          </div>
          <LoadTable 
            loads={filteredLoads} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {editingLoad && (
            <LoadForm
              initialData={editingLoad}
              onClose={() => setEditingLoad(null)}
            />
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Load Suppliers</h2>
          <Button onClick={() => setShowAddSupplier(true)}>
            <LuPlus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
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