
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CarrierForm } from "./CarrierForm";
import { CarrierTable } from "./CarrierTable";
import { FreightForm } from "./FreightForm";
import { FreightTable } from "./FreightTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LuPlus } from "react-icons/lu";

export function CarrierDashboard() {
  const [showAddCarrier, setShowAddCarrier] = useState(false);
  const [showAddFreight, setShowAddFreight] = useState(false);

  const { data: carriers, isLoading: isLoadingCarriers } = useQuery({
    queryKey: ["/api/carriers"],
    queryFn: async () => {
      const response = await fetch("/api/carriers");
      if (!response.ok) throw new Error("Failed to fetch carriers");
      return response.json();
    },
  });

  const { data: freightEntries, isLoading: isLoadingFreight } = useQuery({
    queryKey: ["/api/freight"],
  });

  const handleAddCarrier = async (formData: FormData) => {
    // Handle carrier submission
    await fetch("/api/carriers", {
      method: "POST",
      body: formData,
    });
    setShowAddCarrier(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Freight Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Freight Management</h2>
          <Button onClick={() => setShowAddFreight(true)}>
            <LuPlus className="mr-2 h-4 w-4" /> New Freight Entry
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
          carriers={carriers} 
          isLoading={isLoadingCarriers} 
        />
      </div>
    </div>
  );
}
