import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFreightLoadSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LuPlus, LuFileText } from "react-icons/lu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertFreightLoad, Carrier } from "@shared/schema";

interface FreightLoadFormProps {
  onClose: () => void;
  initialData?: Partial<InsertFreightLoad> & { id?: number };
  show?: boolean;
  carrierId?: number;
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

export function FreightLoadForm({ onClose, initialData, show, carrierId }: FreightLoadFormProps) {
  const [open, setOpen] = useState(show || false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [files, setFiles] = useState<{
    bol: File | null;
    rateConfirmation: File | null;
    invoice: File | null;
    proofOfDelivery: File | null;
  }>({
    bol: null,
    rateConfirmation: null,
    invoice: null,
    proofOfDelivery: null
  });

  const form = useForm<InsertFreightLoad>({
    resolver: zodResolver(insertFreightLoadSchema),
    defaultValues: {
      carrierId: carrierId ?? initialData?.carrierId ?? 0,
      loadNumber: initialData?.loadNumber ?? "",
      origin: initialData?.origin ?? "",
      destination: initialData?.destination ?? "",
      pickupDate: initialData?.pickupDate,
      deliveryDate: initialData?.deliveryDate,
      status: initialData?.status ?? "Pending",
      rate: initialData?.rate ?? "0",
      weight: initialData?.weight ?? "0",
      commodity: initialData?.commodity ?? "",
      notes: initialData?.notes ?? "",
      paymentStatus: initialData?.paymentStatus ?? "Unpaid"
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
      rateConfirmation: null,
      invoice: null,
      proofOfDelivery: null
    });
  };

  async function onSubmit(data: InsertFreightLoad) {
    try {
      const formData = new FormData();

      if (initialData?.id) {
        formData.append('id', initialData.id.toString());
      }

      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'pickupDate' || key === 'deliveryDate') {
            formData.append(key, value ? new Date(value).toISOString() : '');
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append files only if they exist
      if (files.bol) formData.append('bolFile', files.bol);
      if (files.rateConfirmation) formData.append('rateConfirmationFile', files.rateConfirmation);
      if (files.invoice) formData.append('invoiceFile', files.invoice);
      if (files.proofOfDelivery) formData.append('proofOfDeliveryFile', files.proofOfDelivery);

      const url = initialData?.id ? `/api/freight-loads/${initialData.id}` : '/api/freight-loads';
      const method = initialData?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || `Failed to ${initialData ? 'update' : 'create'} freight load`);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/freight-loads"] });
      handleClose();
      toast({
        title: initialData ? "Freight load updated successfully" : "Freight load created successfully",
        description: initialData ? "The freight load has been updated" : "New freight load has been created",
      });
    } catch (error) {
      console.error('Error saving freight load:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!initialData && (
        <DialogTrigger asChild>
          <Button>
            <LuPlus className="mr-2 h-4 w-4" /> New Freight Load
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Freight Load" : "Create New Freight Load"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the freight load information using the form below. All fields marked with * are required."
              : "Enter the freight load information using the form below. All fields marked with * are required."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="loadNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load Number *</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pickupDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="commodity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commodity</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        <SelectItem value="In Transit">In Transit</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Add any relevant notes here..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <FileInputWithPreview
                currentFile={initialData?.bolFile || null}
                onChange={(e) => handleFileChange('bol', e)}
                label="Bill of Lading"
                name="bolFile"
              />
              <FileInputWithPreview
                currentFile={initialData?.rateConfirmationFile || null}
                onChange={(e) => handleFileChange('rateConfirmation', e)}
                label="Rate Confirmation"
                name="rateConfirmationFile"
              />
              <FileInputWithPreview
                currentFile={initialData?.invoiceFile || null}
                onChange={(e) => handleFileChange('invoice', e)}
                label="Invoice"
                name="invoiceFile"
              />
              <FileInputWithPreview
                currentFile={initialData?.proofOfDeliveryFile || null}
                onChange={(e) => handleFileChange('proofOfDelivery', e)}
                label="Proof of Delivery"
                name="proofOfDeliveryFile"
              />
            </div>
            <Button type="submit">{initialData ? "Update Freight Load" : "Create Freight Load"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
