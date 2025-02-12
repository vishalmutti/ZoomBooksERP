import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLoadSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LuPlus } from "react-icons/lu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertLoad } from "@shared/schema";

function generateLoadId(type: string) {
  const date = new Date();
  const typePrefix = type.substring(0, 3).toUpperCase();
  const dateStr = date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${typePrefix}-${dateStr}-${random}`;
}

export function IncomingLoadForm() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<InsertLoad>({
    resolver: zodResolver(insertLoadSchema),
    defaultValues: {
      loadType: "Incoming",
      notes: "",
      status: "Pending",
      loadId: generateLoadId("Incoming"),
      pickupLocation: "",
      deliveryLocation: "",
      scheduledPickup: new Date(),
      scheduledDelivery: new Date(),
      carrier: "",
      driverName: "",
      driverPhone: "",
      equipment: "",
      freightCost: null,
      // Incoming specific fields
      containerNumber: "",
      bookingNumber: "",
      vesselName: "",
      voyageNumber: "",
      estimatedPortArrival: null,
      actualPortArrival: null,
      customsClearanceDate: null,
    }
  });

  async function onSubmit(data: InsertLoad) {
    try {
      const loadId = generateLoadId(data.loadType);

      const response = await fetch('/api/loads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          loadId,
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
        setOpen(false);
        form.reset();
        toast({
          title: "Success",
          description: "Incoming load created successfully",
        });
      } else {
        throw new Error("Failed to create load");
      }
    } catch (error) {
      console.error("Failed to create load:", error);
      toast({
        title: "Error",
        description: "Failed to create load. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LuPlus className="mr-2 h-4 w-4" /> New Incoming Load
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Incoming Load</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Loading">Loading</SelectItem>
                        <SelectItem value="Customs">Customs</SelectItem>
                        <SelectItem value="Port Arrival">Port Arrival</SelectItem>
                        <SelectItem value="In Transit">In Transit</SelectItem>
                        <SelectItem value="Final Delivery">Final Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Container Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="containerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Container Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter container number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter booking number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Vessel Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vesselName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vessel Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter vessel name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="voyageNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voyage Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter voyage number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedPortArrival"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Port Arrival</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actualPortArrival"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Port Arrival</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pickupLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter pickup location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter delivery location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Carrier Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter carrier name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="equipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter equipment details" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Driver Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter driver's name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="driverPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter driver's phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Costs */}
            <FormField
              control={form.control}
              name="freightCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Freight Cost</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      value={field.value || ''} 
                      placeholder="Enter freight cost" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      value={field.value || ''}
                      placeholder="Add any relevant notes here..." 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Create Incoming Load</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
