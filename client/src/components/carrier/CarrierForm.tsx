
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Carrier {
  id: number;
  name: string;
}

interface CarrierFormData {
  date: string;
  referenceNumber: string;
  carrier: string;
  freightCost: number;
  freightInvoice?: File;
  pod?: File;
}

interface CarrierFormProps {
  initialData?: CarrierFormData;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function CarrierForm({ initialData, onOpenChange, open }: CarrierFormProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const form = useForm<CarrierFormData>({
    defaultValues: initialData,
  });

  useEffect(() => {
    // This will be replaced with actual API call when backend is ready
    const mockCarriers = [
      { id: 1, name: "ABC Trucking" },
      { id: 2, name: "XYZ Transport" }
    ];
    setCarriers(mockCarriers);
  }, []);

  const queryClient = useQueryClient();
  
  const onSubmit = async (data: CarrierFormData) => {
    try {
      const url = initialData ? `/api/carrier-loads/${initialData.id}` : '/api/carrier-loads';
      const method = initialData ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('carrierData', JSON.stringify({
        date: data.date,
        referenceNumber: data.referenceNumber,
        carrier: data.carrier,
        freightCost: parseFloat(data.freightCost.toString()),
        status: "UNPAID"
      }));
      
      if (data.freightInvoice) {
        formData.append('freightInvoice', data.freightInvoice);
      }
      if (data.pod) {
        formData.append('pod', data.pod);
      }

      const response = await fetch(url, {
        method,
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to create carrier load');
      }

      const result = await response.json();
      console.log('Carrier load created:', result);
      
      // Invalidate and refetch carrier loads data
      await queryClient.invalidateQueries({ queryKey: ['carrier-loads'] });
      
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating carrier load:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!initialData && (
        <DialogTrigger asChild>
          <Button className="mb-4">Add New Carrier</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Carrier' : 'Add New Carrier'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a carrier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Carriers</SelectLabel>
                        {carriers.map((carrier) => (
                          <SelectItem key={carrier.id} value={carrier.name}>
                            {carrier.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="freightCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Freight Cost</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="freightInvoice"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>Freight Invoice</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pod"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>POD</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
