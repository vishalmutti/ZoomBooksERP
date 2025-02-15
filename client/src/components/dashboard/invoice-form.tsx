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
import { insertInvoiceSchema, type InsertInvoice, type InsertInvoiceItem, type Invoice, type InvoiceItem, type Supplier } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Loader2, Plus, Upload, Download, Trash2 } from "lucide-react";
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
  editInvoice?: Invoice & { items?: InvoiceItem[] };
  onComplete?: () => void;
}

export function InvoiceForm({ editInvoice, onComplete }: InvoiceFormProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const initialMode = editInvoice?.uploadedFile ? "upload" : "manual";
  const [mode, setMode] = useState<"manual" | "upload">(initialMode);
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [bolFile, setBolFile] = useState<File | null>(null);
  const [freightInvoiceFile, setFreightInvoiceFile] = useState<File | null>(null); // Added state for freight invoice file

  // Add polling to invoice query
  const { data: currentInvoiceData } = useQuery<Invoice & { items?: InvoiceItem[] }>({
    queryKey: [`/api/invoices/${editInvoice?.id}`],
    enabled: !!editInvoice?.id,
    refetchInterval: 2000, // Poll every 2 seconds when editing
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${editInvoice?.id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      return response.json();
    },
  });

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      supplierId: currentInvoiceData?.supplierId || editInvoice?.supplierId || 0,
      invoiceNumber: currentInvoiceData?.invoiceNumber || editInvoice?.invoiceNumber || "",
      carrier: currentInvoiceData?.carrier || editInvoice?.carrier || "",
      dueDate: currentInvoiceData?.dueDate ? new Date(currentInvoiceData.dueDate).toISOString().split('T')[0] :
               editInvoice?.dueDate ? new Date(editInvoice.dueDate).toISOString().split('T')[0] : "",
      totalAmount: currentInvoiceData?.totalAmount?.toString() || editInvoice?.totalAmount?.toString() || "0",
      freightCost: currentInvoiceData?.freightCost?.toString() || editInvoice?.freightCost?.toString() || "0",
      notes: currentInvoiceData?.notes || editInvoice?.notes || "",
      isPaid: currentInvoiceData?.isPaid || editInvoice?.isPaid || false,
      items: currentInvoiceData?.items?.length
        ? currentInvoiceData.items.map(item => ({
            description: item.description,
            quantity: item.quantity?.toString() || "0",
            unitPrice: item.unitPrice?.toString() || "0",
            totalPrice: item.totalPrice?.toString() || "0",
            invoiceId: currentInvoiceData.id
          }))
        : editInvoice?.items?.length
        ? editInvoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity?.toString() || "0",
            unitPrice: item.unitPrice?.toString() || "0",
            totalPrice: item.totalPrice?.toString() || "0",
            invoiceId: editInvoice.id
          }))
        : [{ description: "", quantity: "0", unitPrice: "0", totalPrice: "0", invoiceId: 0 }]
    }
  });

  useEffect(() => {
    if (!dialogOpen && (currentInvoiceData || editInvoice)) {
      const invoiceData = currentInvoiceData || editInvoice;
      if (!invoiceData) return;

      setDialogOpen(true);
      setMode(invoiceData.uploadedFile ? "upload" : "manual");

      form.reset({
        supplierId: invoiceData.supplierId,
        invoiceNumber: invoiceData.invoiceNumber,
        dueDate: new Date(invoiceData.dueDate).toISOString().split('T')[0],
        totalAmount: invoiceData.totalAmount.toString(),
        currency: invoiceData.currency || "USD",
        notes: invoiceData.notes || "",
        isPaid: invoiceData.isPaid,
        items: invoiceData.items?.map(item => ({
          description: item.description,
          quantity: item.quantity?.toString() || "0",
          unitPrice: item.unitPrice?.toString() || "0",
          totalPrice: item.totalPrice?.toString() || "0",
          invoiceId: invoiceData.id
        })) || [{ description: "", quantity: "0", unitPrice: "0", totalPrice: "0", invoiceId: 0 }],
        carrier: invoiceData.carrier || "",
        freightCost: invoiceData.freightCost?.toString() || "0"
      });
    }
  }, [currentInvoiceData, editInvoice, form]);

  const { data: suppliers = [] } = useQuery<Supplier[]>({
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

      // Handle invoice file upload
      if (mode === "upload" && file) {
        formData.append('file', file);
      }

      // Always append BOL file if present, regardless of mode
      if (bolFile) {
        formData.append('bolFile', bolFile);
      }

      // Append freight invoice file if present
      if (freightInvoiceFile) {
        formData.append('freightInvoiceFile', freightInvoiceFile);
      }

      const invoiceData = {
        ...data,
        mode,
        items: mode === "manual" ? data.items : undefined,
      };

      if (invoiceData.dueDate) {
        invoiceData.dueDate = new Date(invoiceData.dueDate).toISOString();
      }

      formData.append('invoiceData', JSON.stringify(invoiceData));

      const res = await apiRequest(
        editInvoice ? "PATCH" : "POST",
        editInvoice ? `/api/invoices/${editInvoice.id}` : "/api/invoices",
        formData
      );

      if (res.status === 500) {
        return {};
      }

      return res.json();
    },
    onSuccess: async (updatedInvoice) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["/api/invoices"],
          refetchType: "all"
        }),
        queryClient.invalidateQueries({
          queryKey: [`/api/invoices/${updatedInvoice.id}`],
          refetchType: "all"
        })
      ]);

      if (updatedInvoice) {
        form.reset({
          ...updatedInvoice,
          items: updatedInvoice.items?.map(item => ({
            description: item.description,
            quantity: item.quantity?.toString() || "0",
            unitPrice: item.unitPrice?.toString() || "0",
            totalPrice: item.totalPrice?.toString() || "0",
            invoiceId: updatedInvoice.id
          }))
        });
      }

      toast({
        title: "Success",
        description: `Invoice ${editInvoice ? "updated" : "created"} successfully`,
      });

      if (editInvoice && onComplete) {
        onComplete();
      } else {
        setDialogOpen(false);
      }
      setFile(null);
      setBolFile(null);
      setFreightInvoiceFile(null); // Clear freight invoice file state
    },
    onError: (error: Error) => {
      if (!error.message.includes('Failed to update invoice')) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleItemChange = (index: number, field: keyof InsertInvoiceItem, value: string) => {
    const items = [...(form.getValues("items") || [])];
    let item = items[index];

    if (item) {
      item = { ...item, [field]: value };
      items[index] = item;

      if (field === "quantity" || field === "unitPrice") {
        const quantity = parseFloat(item.quantity || "0");
        const unitPrice = parseFloat(item.unitPrice || "0");

        if (!isNaN(quantity) && !isNaN(unitPrice)) {
          item.totalPrice = (quantity * unitPrice).toString();
        }
      }

      form.setValue("items", items, { shouldDirty: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleBolFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBolFile(e.target.files[0]);
    }
  };

  const handleFreightInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => { //Added handler for freight invoice
    if (e.target.files && e.target.files[0]) {
      setFreightInvoiceFile(e.target.files[0]);
    }
  };

  const handleModeChange = (value: string) => {
    setMode(value as "manual" | "upload");
    const currentValues = form.getValues();
    form.reset({
      ...currentValues,
      items: value === "manual"
        ? currentValues.items?.length
          ? currentValues.items
          : [{ description: "", quantity: "0", unitPrice: "0", totalPrice: "0", invoiceId: 0 }]
        : currentValues.items
    });
  };

  const handleSubmit = form.handleSubmit((data) => {
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
      if (!data.items || data.items.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one item",
          variant: "destructive",
        });
        return;
      }

      for (const item of data.items) {
        if (!item.description) {
          toast({
            title: "Error",
            description: "Please enter a description for all items",
            variant: "destructive",
          });
          return;
        }
        if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid quantity greater than 0",
            variant: "destructive",
          });
          return;
        }
        if (!item.unitPrice || isNaN(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid unit price greater than 0",
            variant: "destructive",
          });
          return;
        }
      }

      data.totalAmount = data.items
        .reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0)
        .toString();
    }

    updateInvoiceMutation.mutate(data);
  });

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(newOpen) => {
        setDialogOpen(newOpen);
        if (!newOpen && onComplete) {
          onComplete();
        }
      }}
    >
      {!editInvoice && (
        <DialogTrigger asChild>
          <Button className="w-full text-lg">Create Invoice</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div>
                <Label>Supplier</Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
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
                <Label htmlFor="carrier">Carrier</Label>
                <Input {...form.register("carrier")} />
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  type="date"
                  {...form.register("dueDate")}
                />
              </div>

              <TabsContent value="manual">
                <div>
                  <Label>Items</Label>
                  <div className="mt-2 space-y-4">
                    <div className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-6 font-medium">Description</div>
                      <div className="col-span-2 font-medium">Quantity</div>
                      <div className="col-span-2 font-medium">Unit Price</div>
                      <div className="col-span-2 font-medium">Total</div>
                    </div>
                    {form.watch("items")?.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2">
                        <div className="col-span-5">
                          <Input
                            placeholder="Description"
                            defaultValue={item.description}
                            {...form.register(`items.${index}.description`)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Quantity"
                            defaultValue={item.quantity}
                            {...form.register(`items.${index}.quantity`)}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Unit Price"
                            defaultValue={item.unitPrice}
                            {...form.register(`items.${index}.unitPrice`)}
                            onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Total"
                            value={item.totalPrice}
                            readOnly
                          />
                        </div>
                        <div className="col-span-1 flex items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              const items = form.getValues("items") || [];
                              form.setValue("items", items.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-4 my-4">
                      <div className="space-y-2">
                        <Label>Total Amount Currency</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          {...form.register("currency")}
                        >
                          <option value="USD">USD</option>
                          <option value="CAD">CAD</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Freight Cost</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter freight cost"
                          {...form.register("freightCost")}
                        />
                      </div>
                      <div className="space-y-2"> {/* Added div for freight invoice upload */}
                        <Label>Freight Invoice</Label>
                        <Input type="file" onChange={handleFreightInvoiceChange} {...form.register("freightInvoiceFile")} />
                      </div>
                    </div>
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
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Total Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter total amount"
                        {...form.register("totalAmount")}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Freight Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter freight cost"
                        {...form.register("freightCost")}
                      />
                    </div>
                    <div className="w-24">
                      <Label>Currency</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        {...form.register("currency")}
                      >
                        <option value="USD">USD</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
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
                  <div>
                    <Label>Upload BOL</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            {bolFile ? bolFile.name : editInvoice?.bolFile ? "Replace current file" : "Click to upload BOL or drag and drop"}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleBolFileChange}
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                      </label>
                    </div>
                    {editInvoice?.bolFile && (
                      <div className="mt-4">
                        <Label>Current BOL File</Label>
                        <div className="flex items-center justify-between p-2 mt-1 border rounded">
                          <span className="text-sm">{editInvoice.bolFile}</span>
                          <a
                            href={`/uploads/${editInvoice.bolFile}`}
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

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea {...form.register("notes")} />
              </div>
            </div>

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