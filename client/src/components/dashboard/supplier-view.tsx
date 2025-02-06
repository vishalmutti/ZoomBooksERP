import { Supplier, InsertSupplier, insertSupplierSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface SupplierViewProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierView({ supplier, open, onOpenChange }: SupplierViewProps) {
  const { toast } = useToast();
  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: supplier,
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const res = await apiRequest("PATCH", `/api/suppliers/${supplier.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
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

  const onSubmit = form.handleSubmit((data) => {
    updateSupplierMutation.mutate(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input {...form.register("name")} />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input {...form.register("address")} />
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
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={updateSupplierMutation.isPending}
          >
            {updateSupplierMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Supplier
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
