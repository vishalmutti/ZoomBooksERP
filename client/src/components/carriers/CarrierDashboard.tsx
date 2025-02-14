
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CarrierTable } from "./CarrierTable";
import { CarrierForm } from "./CarrierForm";
import type { Carrier, CarrierTransaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LuPlus } from "react-icons/lu";

export function CarrierDashboard() {
  const [showAddCarrier, setShowAddCarrier] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);

  const { data: carriers = [], isLoading, refetch } = useQuery<Carrier[]>({
    queryKey: ["/api/carriers"],
    refetchOnWindowFocus: true,
  });

  const { data: transactions = [] } = useQuery<CarrierTransaction[]>({
    queryKey: ["/api/carrier-transactions"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Carrier Portal</h1>
        <Button onClick={() => setShowAddCarrier(true)}>
          <LuPlus className="h-4 w-4 mr-2" />
          Add Carrier
        </Button>
      </div>

      <CarrierTable
        carriers={carriers}
        transactions={transactions}
        onEdit={setEditingCarrier}
        isLoading={isLoading}
      />

      <Dialog open={showAddCarrier} onOpenChange={setShowAddCarrier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Carrier</DialogTitle>
          </DialogHeader>
          <CarrierForm
            onComplete={() => {
              setShowAddCarrier(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!editingCarrier} 
        onOpenChange={(open) => !open && setEditingCarrier(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Carrier</DialogTitle>
          </DialogHeader>
          {editingCarrier && (
            <CarrierForm
              carrier={editingCarrier}
              onComplete={() => {
                setEditingCarrier(null);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
