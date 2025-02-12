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

function generateLoadId(type: string) {
  const date = new Date();
  const typePrefix = type.substring(0, 3).toUpperCase();
  const dateStr = date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${typePrefix}-${dateStr}-${random}`;
}

export function LoadForm() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [files, setFiles] = useState({
    bol: null,
    materialInvoice: null,
    freightInvoice: null,
    loadPerformance: null
  });

  const form = useForm<InsertLoad>({
    resolver: zodResolver(insertLoadSchema),
    defaultValues: {
      loadType: "Incoming",
      notes: "",
      status: "Pending",
      loadId: generateLoadId("Incoming"),
      location: "",
      loadCost: "0",
      freightCost: "0",
      profitRoi: "0",
    }
  });

  const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({
        ...prev,
        [type]: e.target.files?.[0]
      }));
    }
  };

  async function onSubmit(data: InsertLoad) {
    try {
      const formData = new FormData();
      formData.append('loadData', JSON.stringify(data));

      if (files.bol) formData.append('bol', files.bol);
      if (files.materialInvoice) formData.append('materialInvoice', files.materialInvoice);
      if (files.freightInvoice) formData.append('freightInvoice', files.freightInvoice);
      if (files.loadPerformance) formData.append('loadPerformance', files.loadPerformance);

      const response = await fetch('/api/loads', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
        setOpen(false);
        form.reset();
        toast({
          title: "Success",
          description: "Load created successfully",
        });
      } else {
        throw new Error("Failed to create load");
      }
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
                        <SelectItem value="Completed">Completed</SelectItem>
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Add supplier options dynamically */}
                    </SelectContent>
                  </Select>
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
                  <FormControl>
                    <Input {...field} placeholder="Enter location" />
                  </FormControl>
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
                <Input type="file" onChange={(e) => handleFileChange('bol', e)} />
              </div>
              <div>
                <FormLabel>Material Invoice</FormLabel>
                <Input type="file" onChange={(e) => handleFileChange('materialInvoice', e)} />
              </div>
              <div>
                <FormLabel>Freight Invoice</FormLabel>
                <Input type="file" onChange={(e) => handleFileChange('freightInvoice', e)} />
              </div>
              <div>
                <FormLabel>Load Performance</FormLabel>
                <Input type="file" onChange={(e) => handleFileChange('loadPerformance', e)} />
              </div>
            </div>

            <Button type="submit">Create Load</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}