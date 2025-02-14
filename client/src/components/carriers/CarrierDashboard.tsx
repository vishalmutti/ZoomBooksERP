import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CarrierForm } from "./CarrierForm";
import { CarrierTable } from "./CarrierTable";
import { FreightForm } from "./FreightForm";
import { FreightTable } from "./FreightTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LuPlus } from "react-icons/lu";
import type { Carrier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function CarrierDashboard() {
  const [showAddCarrier, setShowAddCarrier] = useState(false);
  const [showAddFreight, setShowAddFreight] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: carriers, isLoading: isLoadingCarriers } = useQuery<Carrier[]>({
    queryKey: ["/api/carriers"],
    queryFn: () => apiRequest("GET", "/api/carriers")
  });

  const { data: freightEntries, isLoading: isLoadingFreight } = useQuery({
    queryKey: ["/api/freight"],
    queryFn: () => apiRequest("GET", "/api/freight")
  });

  const addCarrierMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("/api/carriers", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      setShowAddCarrier(false);
      toast({
        title: "Success",
        description: "Carrier added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add carrier",
        variant: "destructive",
      });
    },
  });

  const handleAddCarrier = async (data: any) => {
    await addCarrierMutation.mutate(data);
  };

  const handleEditCarrier = async (carrier: Carrier) => {
    // TODO: Implement edit functionality
    console.log("Edit carrier:", carrier);
  };

  const handleDeleteCarrier = async (carrier: Carrier) => {
    // TODO: Implement delete functionality
    console.log("Delete carrier:", carrier);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Freight Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Freight Management</h2>
          <Button onClick={() => setShowAddFreight(true)}>
            <LuPlus className="mr-2 h-4 w-4" /> Add Freight Entry
          </Button>
        </div>

        <Dialog open={showAddFreight} onOpenChange={setShowAddFreight}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Freight Entry</DialogTitle>
            </DialogHeader>
            <FreightForm onComplete={() => setShowAddFreight(false)} />
          </DialogContent>
        </Dialog>

        <FreightTable 
          entries={freightEntries} 
          isLoading={isLoadingFreight}
        />
      </div>

      <div className="border-t my-8" />

      {/* Carrier Management Section */}
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
          carriers={carriers || []} 
          isLoading={isLoadingCarriers}
          onEdit={handleEditCarrier}
          onDelete={handleDeleteCarrier}
        />
      </div>
    </div>
  );
}