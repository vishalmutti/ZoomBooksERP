import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  referenceNumber: z.string().min(1, "Reference number is required"),
  carrier: z.string().min(1, "Carrier is required"),
  freightCost: z.string().min(1, "Freight cost is required"),
  loadType: z.string().min(1, "Load type is required"),
  location: z.string().min(1, "Location is required"),
  status: z.string().min(1, "Status is required"),
  scheduledPickup: z.string().optional(),
  scheduledDelivery: z.string().optional(),
  notes: z.string().optional(),
});

interface FreightFormProps {
  show: boolean;
  onClose: () => void;
  initialData?: z.infer<typeof formSchema>;
}

export function FreightForm({ show, onClose, initialData }: FreightFormProps) {
  const [files, setFiles] = useState<{
    bolFile: File | null;
    freightInvoiceFile: File | null;
  }>({
    bolFile: null,
    freightInvoiceFile: null,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      referenceNumber: "",
      carrier: "",
      freightCost: "",
      loadType: "",
      location: "",
      status: "PENDING",
      notes: "",
    },
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({
        ...prev,
        [type]: e.target.files![0]
      }));
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/freight", data);
      if (!response) throw new Error("Failed to create freight entry");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/freight"] });
      toast({
        title: "Success",
        description: "Freight entry created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create freight entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();

      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Append files if they exist
      if (files.bolFile) formData.append('bolFile', files.bolFile);
      if (files.freightInvoiceFile) formData.append('freightInvoiceFile', files.freightInvoiceFile);

      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error submitting freight form:', error);
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Freight Entry" : "New Freight Entry"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loadType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select load type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FTL">FTL</SelectItem>
                      <SelectItem value="LTL">LTL</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledPickup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Pickup</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledDelivery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Delivery</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>BOL File</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  onChange={(e) => handleFileChange('bolFile', e)}
                  accept=".pdf,.doc,.docx"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Freight Invoice</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  onChange={(e) => handleFileChange('freightInvoiceFile', e)}
                  accept=".pdf,.doc,.docx"
                />
              </FormControl>
            </FormItem>

            <Button type="submit" className="w-full">
              {initialData ? "Update Freight Entry" : "Create Freight Entry"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}