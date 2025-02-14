import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCarrierSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LuPlus } from "react-icons/lu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertCarrier } from "@shared/schema";

interface CarrierFormProps {
  onClose: () => void;
  initialData?: Partial<InsertCarrier> & { id?: number };
  show?: boolean;
}

export function CarrierForm({ onClose, initialData, show }: CarrierFormProps) {
  const [open, setOpen] = useState(show || false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<InsertCarrier>({
    resolver: zodResolver(insertCarrierSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      address: initialData?.address ?? "",
      status: initialData?.status ?? "Active",
      mc_number: initialData?.mc_number ?? "",
      dot_number: initialData?.dot_number ?? "",
      insurance_expiry: initialData?.insurance_expiry,
      notes: initialData?.notes ?? "",
    }
  });

  const handleClose = () => {
    setOpen(false);
    onClose();
    form.reset();
  };

  async function onSubmit(data: InsertCarrier) {
    try {
      const url = initialData?.id ? `/api/carriers/${initialData.id}` : '/api/carriers';
      const method = initialData?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || `Failed to ${initialData ? 'update' : 'create'} carrier`);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      handleClose();
      toast({
        title: initialData ? "Carrier updated successfully" : "Carrier created successfully",
        description: initialData ? "The carrier has been updated" : "New carrier has been created",
      });
    } catch (error) {
      console.error('Error saving carrier:', error);
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
            <LuPlus className="mr-2 h-4 w-4" /> New Carrier
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Carrier" : "Create New Carrier"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the carrier information using the form below. All fields marked with * are required."
              : "Enter the carrier information using the form below. All fields marked with * are required."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="mc_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MC Number</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dot_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DOT Number</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurance_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Expiry</FormLabel>
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
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea {...field} value={field.value ?? ""} placeholder="Add any relevant notes here..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">{initialData ? "Update Carrier" : "Create Carrier"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
