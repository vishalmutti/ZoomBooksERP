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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InvoiceForm() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      isPaid: false,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Invoice</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => createInvoiceMutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input {...form.register("clientName")} />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              type="number"
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input type="date" {...form.register("dueDate")} />
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
