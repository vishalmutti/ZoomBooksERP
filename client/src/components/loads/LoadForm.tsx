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
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Supplier {
  id: number;
  name: string;
}

interface LoadFormProps {
  defaultType: 'Incoming' | 'Wholesale' | 'Miscellaneous';
}

export function LoadForm({ defaultType }: LoadFormProps) {
  const [open, setOpen] = useState(false);
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

  const form = useForm<InsertLoad>({
    resolver: zodResolver(insertLoadSchema),
    defaultValues: {
      loadType: defaultType,
      notes: "",
      location: "",
      referenceNumber: "",
      scheduledPickup: undefined,
      scheduledDelivery: undefined,
      loadCost: "0",
      freightCost: "0",
      profitRoi: "0",
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

  async function onSubmit(data: InsertLoad) {
    try {
      const formData = new FormData();

      // Append all the form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'scheduledPickup' || key === 'scheduledDelivery') {
            formData.append(key, value ? new Date(value).toISOString() : '');
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append files if they exist
      if (files.bol) formData.append('bolFile', files.bol);
      if (files.materialInvoice) formData.append('materialInvoiceFile', files.materialInvoice);
      if (files.freightInvoice) formData.append('freightInvoiceFile', files.freightInvoice);
      if (files.loadPerformance) formData.append('loadPerformanceFile', files.loadPerformance);

      console.log('Submitting form data:', Object.fromEntries(formData.entries()));

      const response = await fetch('/api/loads', {
        method: 'POST',
        body: formData, // FormData will automatically set the correct Content-Type header
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server response:', errorData);
        throw new Error(errorData?.message || 'Failed to create load');
      }

      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      setOpen(false);
      form.reset();
      setFiles({
        bol: null,
        materialInvoice: null,
        freightInvoice: null,
        loadPerformance: null
      });
      toast({
        title: "Success",
        description: "Load created successfully",
      });
    } catch (error) {
      console.error('Error creating load:', error);
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
          <LuPlus className="mr-2 h-4 w-4" /> New Load
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Load</DialogTitle>
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
                                    // Close the popover after selection
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

            {defaultType === 'Wholesale' && (
              <>
                <FormField
                  control={form.control}
                  name="poNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {defaultType === 'Miscellaneous' && (
              <FormField
                control={form.control}
                name="warehouseLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              <div>
                <FormLabel>BOL</FormLabel>
                <Input
                  type="file"
                  onChange={(e) => handleFileChange('bol', e)}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
              </div>
              <div>
                <FormLabel>Material Invoice</FormLabel>
                <Input
                  type="file"
                  onChange={(e) => handleFileChange('materialInvoice', e)}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
              </div>
              <div>
                <FormLabel>Freight Invoice</FormLabel>
                <Input
                  type="file"
                  onChange={(e) => handleFileChange('freightInvoice', e)}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
              </div>
              <div>
                <FormLabel>Load Performance</FormLabel>
                <Input
                  type="file"
                  onChange={(e) => handleFileChange('loadPerformance', e)}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
              </div>
            </div>

            <Button type="submit">Create Load</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}