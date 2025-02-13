import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertSupplier, Supplier } from "@shared/schema";
import React from 'react';

interface LoadSupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
}

export function LoadSupplierForm({ open, onOpenChange, supplier }: LoadSupplierFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      address: "",
      email: "",
      phone: "",
      contactPerson: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (supplier) {
        form.reset({
          name: supplier.name,
          address: supplier.address ?? "",
          contactPerson: supplier.contactPerson ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
        });
      } else {
        form.reset({
          name: "",
          address: "",
          email: "",
          phone: "",
          contactPerson: "",
        });
      }
    }
  }, [supplier, open, form]);

  async function onSubmit(data: InsertSupplier) {
    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, type: 'load' }),
      });

      if (!response.ok) {
        throw new Error("Failed to save supplier");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      onOpenChange(false);

      toast({
        title: "Success",
        description: supplier 
          ? "Supplier updated successfully"
          : "Supplier created successfully",
      });
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast({
        title: "Error",
        description: supplier 
          ? "Failed to update supplier"
          : "Failed to create supplier",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <Button type="submit" className="w-full">
              {supplier ? "Update Supplier" : "Create Supplier"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}