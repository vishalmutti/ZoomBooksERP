import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema, type InsertSupplier } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierForm({ open, onOpenChange }: SupplierFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => createSupplierMutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="name">Supplier Name</Label>
            <Input {...form.register("name")} />
          </div>

          <div>
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input {...form.register("contactPerson")} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input {...form.register("phone")} />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input {...form.register("address")} />
          </div>

          <Button type="submit" className="w-full" disabled={createSupplierMutation.isPending}>
            {createSupplierMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Supplier
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
