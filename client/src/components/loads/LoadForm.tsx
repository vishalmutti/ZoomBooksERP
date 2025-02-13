import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLoadSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LuPlus, LuFileText } from "react-icons/lu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertLoad } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

  const form = useForm<InsertLoad>({
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
      supplierId: ""
    }
  });

  const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({
        ...prev,
        [type]: e.target.files![0]
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

  async function onSubmit(data: InsertLoad) {
    try {
      const formData = new FormData();

      // Ensure all necessary fields are included
      const dataToSend = {
        ...data,
        loadType: data.loadType || initialData?.loadType,
        loadCost: data.loadCost?.toString() || initialData?.loadCost,
        freightCost: data.freightCost?.toString() || initialData?.freightCost,
        profitRoi: data.profitRoi?.toString() || initialData?.profitRoi,
      };

      // Append each field from the form data
      Object.entries(dataToSend).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'scheduledPickup' || key === 'scheduledDelivery') {
            formData.append(key, value ? new Date(value).toISOString() : '');
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append files with correct field names
      if (files.bol) formData.append('bolFile', files.bol);
      if (files.materialInvoice) formData.append('materialInvoiceFile', files.materialInvoice);
      if (files.freightInvoice) formData.append('freightInvoiceFile', files.freightInvoice);
      if (files.loadPerformance) formData.append('loadPerformanceFile', files.loadPerformance);

      const url = initialData ? `/api/loads/${initialData.id}` : '/api/loads';
      const method = initialData ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server response:', errorData);
        throw new Error(errorData?.message || 'Failed to create/update load');
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      await queryClient.refetchQueries({ queryKey: ["/api/loads"] });
      handleClose();
      toast({
        title: initialData ? "Load updated successfully" : "Load created successfully",
        description: initialData ? "The load has been updated" : "New load has been created",
      });
    } catch (error) {
      console.error('Error creating/updating load:', error);
      toast({
        title: "Error",
        description: "Failed to create/update load. Please try again.",
        variant: "destructive",
      });
    }
  }

  const content = (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit Load" : "Create New Load"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="Incoming">Incoming</SelectItem>
                      <SelectItem value="Wholesale">Wholesale</SelectItem>
                      <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          <Button>
            <LuPlus className="mr-2 h-4 w-4" /> New Load
          </Button>
        </DialogTrigger>
      )}
      {content}
    </Dialog>
  );
}