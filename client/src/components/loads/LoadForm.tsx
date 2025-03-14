import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLoadSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LuPlus, LuFileText } from "react-icons/lu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertIncomingLoad } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";


interface Supplier {
  id: number;
  name: string;
}

interface LoadFormProps {
  onClose: () => void;
  initialData?: any;
  defaultType?: 'Incoming' | 'Wholesale' | 'Miscellaneous';
  show?: boolean;
}

const FileInputWithPreview = ({
  currentFile,
  onChange,
  label,
  name,
  accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg"
}: {
  currentFile: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name: string;
  accept?: string;
}) => {
  return (
    <div>
      <FormLabel>{label}</FormLabel>
      <div className="space-y-2">
        {currentFile && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current file:</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => window.open(`/uploads/${currentFile}`, "_blank")}
            >
              <LuFileText className="h-4 w-4 mr-2" />
              View {label}
            </Button>
          </div>
        )}
        <Input
          type="file"
          onChange={onChange}
          accept={accept}
          name={name}
        />
      </div>
    </div>
  );
};

export function LoadForm({ onClose, initialData, defaultType, show }: LoadFormProps) {
  const [open, setOpen] = useState(show || false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [files, setFiles] = useState<{
    bol: File | null;
    materialInvoice: File | null;
    freightInvoice: File | null;
    loadPerformance: File | null;
  }>({
    bol: null,
    materialInvoice: null,
    freightInvoice: null,
    loadPerformance: null
  });

  useEffect(() => {
    if (show !== undefined) {
      setOpen(show);
    }
  }, [show]);

  const form = useForm<InsertIncomingLoad>({
    resolver: zodResolver(insertLoadSchema),
    defaultValues: initialData || {
      loadType: defaultType || "Incoming",
      notes: "",
      location: "",
      referenceNumber: "",
      scheduledPickup: undefined,
      scheduledDelivery: undefined,
      loadCost: "0",
      freightCost: "0",
      profitRoi: "0",
      supplierId: "",
      carrier: "",
      freightCostCurrency: "USD"
    }
  });

  const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFiles(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
    form.reset();
    setFiles({
      bol: null,
      materialInvoice: null,
      freightInvoice: null,
      loadPerformance: null
    });
  };

  async function onSubmit(data: InsertIncomingLoad) {
    try {
      const formData = new FormData();

      // Handle initialData for edit mode
      if (initialData) {
        formData.append('id', initialData.id.toString());
      }

      // Only sync carrier load if both carrier is selected and freight cost > 0
      if (data.carrier && data.freightCost && Number(data.freightCost) > 0) {
        // Check for existing carrier load
        const carrierResponse = await fetch('/api/carrier-loads');
        const carrierLoads = await carrierResponse.json();
        const existingCarrierLoad = carrierLoads.find(load => load.referenceNumber === data.referenceNumber);

        // Create/update carrier load
        const carrierFormData = new FormData();
        carrierFormData.append('carrierData', JSON.stringify({
          date: data.scheduledPickup || new Date().toISOString().split('T')[0],
          referenceNumber: data.referenceNumber,
          carrier: data.carrier,
          freightCost: data.freightCost,
          freightCostCurrency: data.freightCostCurrency,
          status: "UNPAID"
        }));

        // Map BOL to POD and freightInvoice
        if (files.bol) carrierFormData.append('pod', files.bol);
        if (files.freightInvoice) carrierFormData.append('freightInvoice', files.freightInvoice);

        const carrierEndpoint = existingCarrierLoad 
          ? `/api/carrier-loads/${existingCarrierLoad.id}`
          : '/api/carrier-loads';
        const carrierMethod = existingCarrierLoad ? 'PATCH' : 'POST';

        await fetch(carrierEndpoint, {
          method: carrierMethod,
          body: carrierFormData
        });

        await queryClient.invalidateQueries({ queryKey: ["/api/carrier-loads"] });
        console.log('Carrier load synced successfully');
      } else {
        console.log('Skipping carrier load sync - no carrier selected or freight cost is 0');
      }

      // Log form data and files for debugging
      console.log('Form data to submit:', data);
      console.log('Files to submit:', files);

      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'scheduledPickup' || key === 'scheduledDelivery') {
            formData.append(key, value ? new Date(value).toISOString() : '');
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append files only if they exist or keep existing files
      if (files.bol) formData.append('bolFile', files.bol);
      if (files.materialInvoice) formData.append('materialInvoiceFile', files.materialInvoice);
      if (files.freightInvoice) formData.append('freightInvoiceFile', files.freightInvoice);
      if (files.loadPerformance) formData.append('loadPerformanceFile', files.loadPerformance);

      const url = initialData ? `/api/loads/${initialData.id}` : '/api/loads';
      const method = initialData ? 'PATCH' : 'POST';

      console.log(`Making ${method} request to ${url}`);
      console.log('FormData entries:', [...formData.entries()]);

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', errorData);
        throw new Error(errorData?.message || `Failed to ${initialData ? 'update' : 'create'} load`);
      }

      const savedLoad = await response.json();
      console.log('Server response success:', savedLoad);

      await queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      handleClose();
      toast({
        title: initialData ? "Load updated successfully" : "Load created successfully",
        description: initialData ? "The load has been updated" : "New load has been created",
      });
    } catch (error) {
      console.error('Error saving load:', error);
      toast({
        title: "Error",
        description: `Failed to ${initialData ? 'update' : 'create'} load: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }

  const content = (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="load-form-description">
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit Load" : "Create New Load"}</DialogTitle>
        <DialogDescription id="load-form-description">
          {initialData
            ? "Update the load information using the form below. All fields marked with * are required."
            : "Enter the load information using the form below. All fields marked with * are required."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="hidden" {...form.register("loadType")} value="Incoming" />
          </div>

          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => {
              const { data: suppliers = [], isLoading, isError } = useQuery<Supplier[]>({
                queryKey: ["/api/suppliers"],
              });

              if (isLoading) return <FormItem><FormLabel>Supplier</FormLabel><p>Loading...</p></FormItem>;
              if (isError) return <FormItem><FormLabel>Supplier</FormLabel><p>Error loading suppliers</p></FormItem>;

              return (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {field.value
                          ? suppliers.find(s => s.id.toString() === field.value)?.name
                          : "Select supplier..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search suppliers..." />
                        <CommandList>
                          <CommandEmpty>No suppliers found.</CommandEmpty>
                          <CommandGroup>
                            {suppliers.map((supplier) => (
                              <CommandItem
                                key={supplier.id}
                                value={supplier.name}
                                onSelect={() => {
                                  field.onChange(supplier.id.toString());
                                  const popoverElement = document.querySelector('[data-radix-popper-content-id]');
                                  if (popoverElement) {
                                    (popoverElement as HTMLElement).style.display = 'none';
                                  }
                                }}
                              >
                                {supplier.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="British Columbia">British Columbia</SelectItem>
                    <SelectItem value="Ontario">Ontario</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="noFreightCost"
              className="h-4 w-4"
              onChange={(e) => {
                if (e.target.checked) {
                  form.setValue("carrier", "");
                  form.setValue("freightCost", "0");
                  form.setValue("freightCostCurrency", "CAD");
                }
              }}
            />
            <Label htmlFor="noFreightCost">No Freight Cost</Label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="loadCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load Cost</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="freightCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Freight Cost (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="freightCostCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'USD'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="profitRoi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profit ROI</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference #</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduledPickup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Pickup</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
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
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="carrier"
            render={({ field }) => {
              const { data: carriers = [], isLoading, isError } = useQuery({
                queryKey: ["/api/carriers"],
              });

              if (isLoading) return <FormItem><FormLabel>Carrier</FormLabel><p>Loading...</p></FormItem>;
              if (isError) return <FormItem><FormLabel>Carrier</FormLabel><p>Error loading carriers</p></FormItem>;

              return (
                <FormItem>
                  <FormLabel>Carrier (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a carrier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {carriers.map((carrier) => (
                        <SelectItem key={carrier.id} value={carrier.name}>
                          {carrier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Add any relevant notes here..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FileInputWithPreview
              currentFile={initialData?.bolFile || null}
              onChange={(e) => handleFileChange('bol', e)}
              label="BOL"
              name="bolFile"
            />
            <FileInputWithPreview
              currentFile={initialData?.materialInvoiceFile || null}
              onChange={(e) => handleFileChange('materialInvoice', e)}
              label="Material Invoice"
              name="materialInvoiceFile"
            />
            <FileInputWithPreview
              currentFile={initialData?.freightInvoiceFile || null}
              onChange={(e) => handleFileChange('freightInvoice', e)}
              label="Freight Invoice"
              name="freightInvoiceFile"
            />
            <FileInputWithPreview
              currentFile={initialData?.loadPerformanceFile || null}
              onChange={(e) => handleFileChange('loadPerformance', e)}
              label="Load Performance"
              name="loadPerformanceFile"
            />
          </div>

          <Button type="submit">{initialData ? "Update Load" : "Create Load"}</Button>
        </form>
      </Form>
    </DialogContent>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!initialData && (
        <DialogTrigger asChild>
          <Button className="w-full">
            <LuPlus className="mr-2 h-4 w-4" /> New Load
          </Button>
        </DialogTrigger>
      )}
      {content}
    </Dialog>
  );
}