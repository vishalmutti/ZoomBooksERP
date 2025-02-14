import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CarrierForm } from "./CarrierForm";
import { CarrierTable } from "./CarrierTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LuPlus } from "react-icons/lu";
import type { Carrier, InsertCarrier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function CarrierDashboard() {
  const [showAddCarrier, setShowAddCarrier] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: carriers = [], isLoading } = useQuery<Carrier[]>({
    queryKey: ["/api/carriers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/carriers");
      if (!Array.isArray(response)) {
        console.error('Invalid carriers response:', response);
        return [];
      }
      return response;
    }
  });

  const handleAddCarrier = async (data: InsertCarrier) => {
    try {
      await apiRequest("POST", "/api/carriers", data);
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      setShowAddCarrier(false);
      toast({
        title: "Success",
        description: "Carrier added successfully",
      });
    } catch (error) {
      console.error("Error in handleAddCarrier:", error);
      toast({
        title: "Error",
        description: "Failed to add carrier",
        variant: "destructive",
      });
    }
  };

  const handleEditCarrier = async (carrier: Carrier) => {
    console.log("Edit carrier:", carrier);
  };

  const handleDeleteCarrier = async (carrier: Carrier) => {
    console.log("Delete carrier:", carrier);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Carrier Management</h2>
          <Button onClick={() => setShowAddCarrier(true)}>
            <LuPlus className="mr-2 h-4 w-4" /> Add Carrier
          </Button>
        </div>

        <Dialog open={showAddCarrier} onOpenChange={setShowAddCarrier}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Carrier</DialogTitle>
            </DialogHeader>
            <CarrierForm onComplete={handleAddCarrier} />
          </DialogContent>
        </Dialog>

        <CarrierTable 
          carriers={carriers} 
          isLoading={isLoading}
          onEdit={handleEditCarrier}
          onDelete={handleDeleteCarrier}
        />
      </div>
    </div>
  );
}