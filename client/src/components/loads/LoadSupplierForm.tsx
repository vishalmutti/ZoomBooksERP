import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertSupplier, Supplier, SupplierContact } from "@shared/schema";
import { LuPlus, LuTrash } from "react-icons/lu";
import { Textarea } from "@/components/ui/textarea";
import React from 'react';

interface LoadSupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
}

export function LoadSupplierForm({ open, onOpenChange, supplier }: LoadSupplierFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch supplier contacts if editing
  const { data: contacts = [] } = useQuery<SupplierContact[]>({
    queryKey: ["/api/suppliers", supplier?.id, "contacts"],
    enabled: !!supplier?.id, // Only fetch if we have a supplier id
  });

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: React.useMemo(() => ({
      name: supplier?.name ?? "",
      address: supplier?.address ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
      contacts: supplier ? contacts.map(contact => ({
        name: contact.name,
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        isPrimary: contact.isPrimary,
        notes: contact.notes ?? "",
      })) : [],
    }), [supplier, contacts])
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  // Update form values when contacts are loaded or supplier changes
  React.useEffect(() => {
    if (supplier && contacts.length > 0) {
      form.setValue("contacts", contacts.map(contact => ({
        name: contact.name,
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        isPrimary: contact.isPrimary,
        notes: contact.notes ?? "",
      })));
    }
  }, [contacts, supplier, form.setValue]);

  async function onSubmit(data: InsertSupplier) {
    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save supplier");
      }

      // Invalidate both the suppliers list and the specific supplier's contacts
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      if (supplier?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/suppliers", supplier.id, "contacts"]
        });
      }

      onOpenChange(false);
      form.reset();
      toast({
        title: "Success",
        description: supplier 
          ? "Supplier updated successfully"
          : "Supplier created successfully",
      });
    } catch (error) {
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

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Contacts</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ 
                    name: "", 
                    email: "", 
                    phone: "", 
                    isPrimary: false,
                    notes: "" 
                  })}
                >
                  <LuPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => remove(index)}
                  >
                    <LuTrash className="h-4 w-4" />
                  </Button>

                  <FormField
                    control={form.control}
                    name={`contacts.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`contacts.${index}.email`}
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
                    name={`contacts.${index}.phone`}
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

                  <FormField
                    control={form.control}
                    name={`contacts.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full">
              {supplier ? "Update Supplier" : "Create Supplier"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}