
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FreightFormProps {
  show: boolean;
  onClose: () => void;
  initialData?: any;
}

export function FreightForm({ show, onClose, initialData }: FreightFormProps) {
  const [files, setFiles] = useState<{
    file: File | null;
    freightInvoice: File | null;
  }>({
    file: null,
    freightInvoice: null,
  });

  const form = useForm({
    defaultValues: initialData || {
      referenceNumber: "",
      carrier: "",
      freightCost: "",
    },
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({
        ...prev,
        [type]: e.target.files![0]
      }));
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      // Append files if they exist
      if (files.file) formData.append('file', files.file);
      if (files.freightInvoice) formData.append('freightInvoice', files.freightInvoice);

      // Submit form data
      const response = await fetch('/api/freight', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to create freight entry');

      queryClient.invalidateQueries({ queryKey: ["/api/freight"] });
      toast({
        title: "Success",
        description: "Freight entry created successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create freight entry",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Freight Entry" : "New Freight Entry"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormItem>
              <FormLabel>File (BOL/Invoice)</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  onChange={(e) => handleFileChange('file', e)}
                  accept=".pdf,.doc,.docx"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Freight Invoice</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  onChange={(e) => handleFileChange('freightInvoice', e)}
                  accept=".pdf,.doc,.docx"
                />
              </FormControl>
            </FormItem>

            <Button type="submit">
              {initialData ? "Update Freight Entry" : "Create Freight Entry"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
