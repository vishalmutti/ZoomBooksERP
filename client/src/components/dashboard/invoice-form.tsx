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
import { insertInvoiceSchema, type InsertInvoice, type InsertInvoiceItem, type Invoice } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2, Plus, Upload, Download } from "lucide-react";
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

interface InvoiceFormProps {
  editInvoice?: Invoice;
  onComplete?: () => void;
}

export function InvoiceForm({ editInvoice, onComplete }: InvoiceFormProps) {
  const [open, setOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  // Initialize mode based on editInvoice state
  const initialMode = editInvoice?.uploadedFile ? "upload" : "manual";
  const [mode, setMode] = useState<"manual" | "upload">(initialMode);
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      ...editInvoice,
      items: editInvoice?.items || [{ description: "", quantity: "0", unitPrice: "0", totalPrice: "0", invoiceId: 0 }],
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

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const formData = new FormData();
      if (mode === "upload" && file) {
        formData.append('file', file);
      }
      const invoiceData = {
        ...data,
        mode,
        items: mode === "manual" ? data.items : undefined,
      };
      formData.append('invoiceData', JSON.stringify(invoiceData));
      const res = await apiRequest(
        editInvoice ? "PATCH" : "POST",
        editInvoice ? `/api/invoices/${editInvoice.id}` : "/api/invoices",
        formData
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: `Invoice ${editInvoice ? "updated" : "created"} successfully`,
      });
      form.reset({
        isPaid: false,
        items: [{ description: "", quantity: "0", unitPrice: "0", totalPrice: "0", invoiceId: 0 }],
      });
      if (editInvoice && onComplete) {
        onComplete();
      } else {
        setOpen(false);
      }
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    },
  });

  const handleItemChange = (index: number, field: keyof InsertInvoiceItem, value: string) => {
    const items = form.getValues("items") || [];
    const item = items[index];

    form.setValue(`items.${index}.${field}`, value);

    if ((field === "quantity" || field === "unitPrice") && item) {
      const quantity = parseFloat(field === "quantity" ? value : item.quantity);
      const unitPrice = parseFloat(field === "unitPrice" ? value : item.unitPrice);

      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        form.setValue(`items.${index}.totalPrice`, (quantity * unitPrice).toString());
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleModeChange = (value: string) => {
    setMode(value as "manual" | "upload");
    // Preserve existing form data when switching modes
    const currentValues = form.getValues();
    form.reset({
      ...currentValues,
      items: value === "manual" 
        ? currentValues.items?.length 
          ? currentValues.items 
          : [{ description: "", quantity: "0", unitPrice: "0", totalPrice: "0", invoiceId: 0 }]
        : undefined,
    });
    if (value === "manual") {
      setFile(null);
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    // Validation
    if (!data.supplierId) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    if (!data.invoiceNumber) {
      toast({
        title: "Error",
        description: "Please enter an invoice number",
        variant: "destructive",
      });
      return;
    }

    if (!data.dueDate) {
      toast({
        title: "Error",
        description: "Please select a due date",
        variant: "destructive",
      });
      return;
    }

    if (mode === "upload") {
      if (!file && !editInvoice?.uploadedFile) {
        toast({
          title: "Error",
          description: "Please upload an invoice file",
          variant: "destructive",
        });
        return;
      }
      if (!data.totalAmount || isNaN(Number(data.totalAmount)) || Number(data.totalAmount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid total amount greater than 0",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!data.items?.length) {
        toast({
          title: "Error",
          description: "Please add at least one item",
          variant: "destructive",
        });
        return;
      }

      const invalidItems = data.items.some(item =>
        !item.description ||
        isNaN(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        isNaN(Number(item.unitPrice)) ||
        Number(item.unitPrice) <= 0
      );

      if (invalidItems) {
        toast({
          title: "Error",
          description: "Please ensure all items have a description, valid quantity, and unit price",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = data.items.reduce((sum, item) =>
        sum + (parseFloat(item.totalPrice) || 0), 0).toString();
      data.totalAmount = totalAmount;
    }

    updateInvoiceMutation.mutate(data);
  });

  return (
    <Dialog open={editInvoice ? true : open} onOpenChange={editInvoice ? onComplete : setOpen}>
      <DialogTrigger asChild>
        {!editInvoice && <Button>Create Invoice</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editInvoice ? "Edit" : "Create New"} Invoice</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} className="w-full" onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-4">
              {/* Supplier Selection */}
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

              {/* Invoice Number */}
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input {...form.register("invoiceNumber")} />
              </div>

              {/* Due Date */}
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input type="date" {...form.register("dueDate")} />
              </div>

              {/* Mode specific content */}
              <TabsContent value="manual">
                <div>
                  <Label>Items</Label>
                  <div className="mt-2 space-y-4">
                    {form.watch("items")?.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <Input
                            placeholder="Description"
                            {...form.register(`items.${index}.description`)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Quantity"
                            {...form.register(`items.${index}.quantity`, {
                              onChange: (e) => handleItemChange(index, "quantity", e.target.value),
                            })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Unit Price"
                            {...form.register(`items.${index}.unitPrice`, {
                              onChange: (e) => handleItemChange(index, "unitPrice", e.target.value),
                            })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Total"
                            {...form.register(`items.${index}.totalPrice`)}
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const items = form.getValues("items") || [];
                        form.setValue("items", [
                          ...items,
                          { description: "", quantity: "0", unitPrice: "0", totalPrice: "0", invoiceId: 0 },
                        ]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload">
                <div className="space-y-4">
                  <div>
                    <Label>Total Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter total amount"
                      {...form.register("totalAmount")}
                    />
                  </div>
                  <div>
                    <Label>Upload Invoice</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            {file ? file.name : editInvoice?.uploadedFile ? "Replace current file" : "Click to upload or drag and drop"}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                      </label>
                    </div>
                    {editInvoice?.uploadedFile && (
                      <div className="mt-4">
                        <Label>Current File</Label>
                        <div className="flex items-center justify-between p-2 mt-1 border rounded">
                          <span className="text-sm">{editInvoice.uploadedFile}</span>
                          <a
                            href={`/uploads/${editInvoice.uploadedFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea {...form.register("notes")} />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={updateInvoiceMutation.isPending}
            >
              {updateInvoiceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editInvoice ? "Update" : "Create"} Invoice
            </Button>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}