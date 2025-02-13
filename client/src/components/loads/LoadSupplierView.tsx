
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Supplier } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LuPackage } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadSupplierViewProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SupplierMetrics({ supplierId }: { supplierId: number }) {
  const { data: loadCount, isLoading } = useQuery<number>({
    queryKey: ["suppliers", supplierId, "loads", "count"],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/${supplierId}/loads/count`);
      if (!response.ok) throw new Error('Failed to fetch load count');
      return response.json();
    },
    enabled: !!supplierId,
  });

  if (isLoading) {
    return <Skeleton className="h-[120px] w-full" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Incoming Loads</CardTitle>
        <LuPackage className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loadCount || 0}</div>
      </CardContent>
    </Card>
  );
}

export function LoadSupplierView({ supplier, open, onOpenChange }: LoadSupplierViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid gap-4">
            <SupplierMetrics supplierId={supplier.id} />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Contact Person</h3>
              <p>{supplier.contactPerson}</p>
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p>{supplier.email}</p>
            </div>
            <div>
              <h3 className="font-medium">Phone</h3>
              <p>{supplier.phone}</p>
            </div>
            <div>
              <h3 className="font-medium">Address</h3>
              <p>{supplier.address}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
