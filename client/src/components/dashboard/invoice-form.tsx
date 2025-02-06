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
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function InvoiceForm() {
  const [open, setOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      isPaid: false,
      items: [{ description: "", quantity: "0", unitPrice: "0", totalPrice: "0" }],
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
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('invoiceData', JSON.stringify({
        ...data,
        // Clear items if in upload mode
        items: mode === "upload" ? undefined : data.items
      }));

      const res = await apiRequest("POST", "/api/invoices", formData);
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
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleItemChange = (index: number, field: string, value: string) => {
    const items = form.getValues("items") || [];
    const item = items[index];

    // Update the field first
    form.setValue(`items.${index}.${field}`, value);

    // Only auto-calculate if both quantity and unit price are valid numbers
    if ((field === "quantity" || field === "unitPrice") && !item.totalPrice) {
      const quantity = parseFloat(field === "quantity" ? value : item.quantity);
      const unitPrice = parseFloat(field === "unitPrice" ? value : item.unitPrice);

      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        const totalPrice = (quantity * unitPrice).toString();
        form.setValue(`items.${index}.totalPrice`, totalPrice);
      }
    }
  };

  const addItem = () => {
    const items = form.getValues("items") || [];
    form.setValue("items", [
      ...items,
      { description: "", quantity: "0", unitPrice: "0", totalPrice: "0" },
    ]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items") || [];
    form.setValue(
      "items",
      items.filter((_, i) => i !== index)
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleModeChange = (value: string) => {
    setMode(value as "manual" | "upload");
    // Reset form when changing modes
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Invoice</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="manual" className="w-full" onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit((data) => createInvoiceMutation.mutate(data))} className="space-y-6 mt-4">
            <div className="space-y-4">
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

              <TabsContent value="manual">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-start text-sm font-medium text-muted-foreground mb-1">
                      <div className="col-span-4">Description</div>
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-2">Unit Price ($)</div>
                      <div className="col-span-3">Total Amount ($)</div>
                      <div className="col-span-1"></div>
                    </div>
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
                              onChange: (e) =>
                                handleItemChange(index, "quantity", e.target.value),
                            })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            {...form.register(`items.${index}.unitPrice`, {
                              onChange: (e) =>
                                handleItemChange(index, "unitPrice", e.target.value),
                            })}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Total"
                            {...form.register(`items.${index}.totalPrice`)}
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
              </TabsContent>

              <TabsContent value="upload">
                <div>
                  <div>
                    <Label>Total Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter total amount"
                      {...form.register("totalAmount")}
                    />
                  </div>
                  <div className="mt-4">
                    <Label>Upload Invoice</Label>
                    <div className="mt-2">
                      <label className="flex items-center gap-2 justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="w-6 h-6 text-gray-400" />
                          <span className="font-medium text-gray-600">
                            {file ? file.name : "Drop files to Attach, or browse"}
                          </span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea {...form.register("notes")} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={createInvoiceMutation.isPending}>
              {createInvoiceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Invoice
            </Button>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}