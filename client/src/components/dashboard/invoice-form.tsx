import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema, type InsertInvoice } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { Check } from "lucide-react"

export function InvoiceForm() {
  const [open, setOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      isPaid: false,
      items: [{ description: "", quantity: 0, unitPrice: 0, totalPrice: 0 }],
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers", supplierSearch],
    queryFn: async () => {
      const url = supplierSearch
        ? `/api/suppliers?q=${encodeURIComponent(supplierSearch)}`
        : "/api/suppliers";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const res = await apiRequest("POST", "/api/invoices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      form.reset();
      setOpen(false);
    },
  });

  const handleItemChange = (index: number, field: string, value: number) => {
    const items = form.getValues("items") || [];
    const item = items[index];

    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : item.quantity;
      const unitPrice = field === "unitPrice" ? value : item.unitPrice;
      const totalPrice = quantity * unitPrice;

      form.setValue(`items.${index}.${field}`, value);
      form.setValue(`items.${index}.totalPrice`, totalPrice);
    }
  };

  const addItem = () => {
    const items = form.getValues("items") || [];
    form.setValue("items", [
      ...items,
      { description: "", quantity: 0, unitPrice: 0, totalPrice: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items") || [];
    form.setValue(
      "items",
      items.filter((_, i) => i !== index)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Invoice</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => createInvoiceMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Supplier</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {form.watch("supplierId")
                    ? suppliers.find((supplier) => supplier.id === form.watch("supplierId"))?.name
                    : "Select supplier..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Search suppliers..."
                    value={supplierSearch}
                    onValueChange={setSupplierSearch}
                  />
                  <CommandEmpty>No suppliers found.</CommandEmpty>
                  <CommandGroup>
                    {suppliers.map((supplier) => (
                      <CommandItem
                        key={supplier.id}
                        value={supplier.name}
                        onSelect={() => {
                          form.setValue("supplierId", supplier.id);
                          setComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            form.watch("supplierId") === supplier.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {supplier.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input {...form.register("invoiceNumber")} />
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input type="date" {...form.register("dueDate")} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {form.watch("items")?.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <Input
                      placeholder="Description"
                      {...form.register(`items.${index}.description`)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      {...form.register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                        onChange: (e) =>
                          handleItemChange(index, "quantity", parseFloat(e.target.value)),
                      })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      {...form.register(`items.${index}.unitPrice`, {
                        valueAsNumber: true,
                        onChange: (e) =>
                          handleItemChange(index, "unitPrice", parseFloat(e.target.value)),
                      })}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Total"
                      value={form.watch(`items.${index}.totalPrice`)}
                      disabled
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input {...form.register("notes")} />
          </div>

          <Button type="submit" className="w-full" disabled={createInvoiceMutation.isPending}>
            {createInvoiceMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Invoice
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}