
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LuPackage } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Supplier } from "@shared/schema";

interface SupplierQuickViewProps {
  supplierName: string;
  supplierId: number;
}

function SupplierMetrics({ supplierId }: { supplierId: number }) {
  const { data, isLoading } = useQuery<{ count: number, averageCost: number, averageRoi: number }>({
    queryKey: ["suppliers", supplierId, "loads", "metrics"],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/${supplierId}/loads/count`);
      if (!response.ok) throw new Error('Failed to fetch load metrics');
      return response.json();
    },
    enabled: !!supplierId,
  });

  if (isLoading) {
    return <div className="grid gap-4">
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-[120px] w-full" />
    </div>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
          <LuPackage className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data?.count || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
          <LuPackage className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${data?.averageCost ? data.averageCost.toFixed(2) : '0.00'}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
          <LuPackage className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data?.averageRoi ? data.averageRoi.toFixed(2) : '0.00'}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SupplierQuickView({ supplierName, supplierId }: SupplierQuickViewProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-normal">
          {supplierName}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">{supplierName} Metrics</h4>
          <SupplierMetrics supplierId={supplierId} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
