
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface CarrierViewProps {
  carrier: {
    id: number;
    name: string;
    contactName: string;
    email: string;
    phone: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CarrierView({ carrier, open, onOpenChange }: CarrierViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: carrier
  });

  const { data: loads = [] } = useQuery({
    queryKey: ['carrier-loads', carrier.name],
    queryFn: async () => {
      const response = await fetch(`/api/carrier-loads?carrier=${encodeURIComponent(carrier.name)}`);
      if (!response.ok) throw new Error('Failed to fetch carrier loads');
      return response.json();
    }
  });

  const paidLoads = loads.filter(load => load.status === 'PAID');
  const unpaidLoads = loads.filter(load => load.status === 'UNPAID');

  const updateCarrierMutation = useMutation({
    mutationFn: async (data: typeof carrier) => {
      const response = await fetch(`/api/carriers/${carrier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update carrier');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast({ title: "Success", description: "Carrier updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateCarrierMutation.mutate(data);
  });

  // Calculate totals
  const unpaidTotal = unpaidLoads.reduce((sum, load) => sum + Number(load.freightCost), 0);
  const paidTotal = paidLoads.reduce((sum, load) => sum + Number(load.freightCost), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{carrier.name}</span>
            <Badge variant={unpaidTotal > 0 ? "destructive" : "default"}>
              Outstanding: ${unpaidTotal.toFixed(2)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <Label htmlFor="contactName">Contact Person</Label>
                <Input {...form.register("contactName")} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input type="email" {...form.register("email")} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input {...form.register("phone")} />
              </div>
              <Button type="submit" disabled={updateCarrierMutation.isPending}>
                {updateCarrierMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </div>

          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Freight Summary</h3>
              <div className="mt-2 space-y-1">
                <p>
                  <span className="font-medium">Unpaid Loads:</span> {unpaidLoads.length}
                  <span className="ml-2 text-destructive">(${unpaidTotal.toFixed(2)})</span>
                </p>
                <p>
                  <span className="font-medium">Paid Loads:</span> {paidLoads.length}
                  <span className="ml-2 text-green-600">(${paidTotal.toFixed(2)})</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Freight History</h3>
              <ScrollArea className="h-[400px] pr-4">
                {unpaidLoads.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-destructive">Outstanding Loads</h4>
                    {unpaidLoads.map((load) => (
                      <Card key={load.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">Reference: {load.referenceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              Date: {format(new Date(load.date), "PPP")}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            ${Number(load.freightCost).toFixed(2)}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {paidLoads.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-muted-foreground">Paid Loads</h4>
                    {paidLoads.map((load) => (
                      <Card key={load.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">Reference: {load.referenceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              Date: {format(new Date(load.date), "PPP")}
                            </p>
                          </div>
                          <Badge variant="default">
                            ${Number(load.freightCost).toFixed(2)}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
