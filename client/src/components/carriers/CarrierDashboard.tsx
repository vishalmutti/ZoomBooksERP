import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CarrierForm } from "./CarrierForm";
import { CarrierTable } from "./CarrierTable";
import { FreightForm } from "./FreightForm";
import { FreightTable } from "./FreightTable";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { LuPlus } from "react-icons/lu";

export function CarrierDashboard() {
  const [showAddCarrier, setShowAddCarrier] = useState(false);
  const [showAddFreight, setShowAddFreight] = useState(false);

  const { data: carriers, isLoading: isLoadingCarriers } = useQuery({
    queryKey: ["/api/carriers"],
  });

  const { data: freightEntries, isLoading: isLoadingFreight } = useQuery({
    queryKey: ["/api/freight"],
  });

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

        <FreightForm 
          show={showAddFreight} 
          onClose={() => setShowAddFreight(false)} 
        />

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

        <CarrierForm 
          show={showAddCarrier} 
          onClose={() => setShowAddCarrier(false)} 
        />

        <CarrierTable 
          carriers={carriers} 
          isLoading={isLoadingCarriers} 
        />
      </div>
    </div>
  );
}