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
import { LuPlus } from "react-icons/lu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertLoad } from "@shared/schema";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
}) => (
  <div>
    <FormLabel>{label}</FormLabel>
    <Input type="file" onChange={onChange} accept={accept} name={name} />
  </div>
);

export function LoadForm({ onClose, initialData, defaultType, show }: LoadFormProps) {
  const [open, setOpen] = useState(show || false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [files, setFiles] = useState({
    bol: null,
    invoice: null,
    freightInvoice: null
  });

  const form = useForm<InsertLoad>({
    resolver: zodResolver(insertLoadSchema),
    defaultValues: initialData || {
      loadType: defaultType || "Incoming",
      supplierId: "",
      location: "",
      invoiceNumber: "",
      carrier: "",
      amount: "0",
      freightCost: "0",
      scheduledDate: null,
      notes: ""
    }
  });

  const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({
        ...prev,
        [type]: e.target.files?.[0] || null
      }));
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
    form.reset();
    setFiles({
      bol: null,
      invoice: null,
      freightInvoice: null
    });
  };

  async function onSubmit(data: InsertLoad) {
    try {
      const formData = new FormData();

      if (initialData) {
        formData.append('id', initialData.id.toString());
      }

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      if (files.bol) formData.append('bolFile', files.bol);
      if (files.invoice) formData.append('invoiceFile', files.invoice);
      if (files.freightInvoice) formData.append('freightInvoiceFile', files.freightInvoice);

      const response = await fetch(initialData ? `/api/loads/${initialData.id}` : '/api/loads', {
        method: initialData ? 'PATCH' : 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
      handleClose();
      toast({
        title: initialData ? "Load updated" : "Load created",
        description: initialData ? "Load has been updated successfully" : "New load has been created successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: `Failed to ${initialData ? 'update' : 'create'} load`,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!initialData && (
        <DialogTrigger asChild>
          <Button>
            <LuPlus className="mr-2 h-4 w-4" /> New Load
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Load" : "Create New Load"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update the load details" : "Enter the load details"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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

            {form.watch("loadType") === "Wholesale" && (
              <>
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
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
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
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
              </>
            )}

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
                    <Textarea {...field} />
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
                currentFile={initialData?.invoiceFile || null}
                onChange={(e) => handleFileChange('invoice', e)}
                label="Invoice"
                name="invoiceFile"
              />
              <FileInputWithPreview
                currentFile={initialData?.freightInvoiceFile || null}
                onChange={(e) => handleFileChange('freightInvoice', e)}
                label="Freight Invoice"
                name="freightInvoiceFile"
              />
            </div>

            <Button type="submit">{initialData ? "Update Load" : "Create Load"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}