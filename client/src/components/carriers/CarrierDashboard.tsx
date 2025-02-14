import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CarrierForm } from "./CarrierForm";
import { FreightLoadForm } from "./FreightLoadForm";
import { useState } from "react";
import type { Carrier, FreightLoad } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CarrierTable } from "./CarrierTable";
import { FreightLoadTable } from "./FreightLoadTable";

export function CarrierDashboard() {
  const [selectedCarrier, setSelectedCarrier] = useState<(Carrier & { id: number }) | null>(null);
  const [selectedFreightLoad, setSelectedFreightLoad] = useState<(FreightLoad & { id: number }) | null>(null);
  const { toast } = useToast();

  const { data: carriers = [], isLoading: isLoadingCarriers } = useQuery<(Carrier & { id: number })[]>({
    queryKey: ["/api/carriers"],
  });

  const { data: freightLoads = [], isLoading: isLoadingFreightLoads } = useQuery<FreightLoad[]>({
    queryKey: ["/api/freight-loads"],
  });

  const deleteCarrier = async (id: number) => {
    try {
      const response = await fetch(`/api/carriers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete carrier');
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      if (selectedCarrier?.id === id) {
        setSelectedCarrier(null);
      }

      toast({
        title: "Carrier deleted",
        description: "The carrier has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting carrier:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete carrier",
        variant: "destructive",
      });
    }
  };

  const deleteFreightLoad = async (id: number) => {
    try {
      const response = await fetch(`/api/freight-loads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete freight load');
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/freight-loads"] });

      toast({
        title: "Freight load deleted",
        description: "The freight load has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting freight load:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete freight load",
        variant: "destructive",
      });
    }
  };

  if (isLoadingCarriers) {
    return <div>Loading carriers...</div>;
  }

  const filteredFreightLoads = selectedCarrier 
    ? freightLoads.filter(load => load.carrierId === selectedCarrier.id)
    : freightLoads;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Carrier Portal</h1>
        <CarrierForm onClose={() => setSelectedCarrier(null)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carriers</CardTitle>
          <CardDescription>Manage your carriers and their freight loads</CardDescription>
        </CardHeader>
        <CardContent>
          <CarrierTable 
            data={carriers}
            onEdit={setSelectedCarrier}
            onDelete={deleteCarrier}
            onSelect={setSelectedCarrier}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {selectedCarrier 
                ? `${selectedCarrier.name}'s Freight Loads` 
                : 'All Freight Loads'}
            </CardTitle>
            <CardDescription>
              {selectedCarrier 
                ? 'View and manage freight loads for this carrier'
                : 'View and manage all freight loads'}
            </CardDescription>
          </div>
          <FreightLoadForm
            onClose={() => setSelectedFreightLoad(null)}
            initialData={selectedFreightLoad}
            show={!!selectedFreightLoad}
            carrierId={selectedCarrier?.id}
          />
        </CardHeader>
        <CardContent>
          {isLoadingFreightLoads ? (
            <div>Loading freight loads...</div>
          ) : (
            <FreightLoadTable 
              data={filteredFreightLoads}
              onEdit={setSelectedFreightLoad}
              onDelete={deleteFreightLoad}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}