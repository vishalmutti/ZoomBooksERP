
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplierMetric {
  supplier_id: string;
  supplier_name: string;
  load_count: number;
  avg_roi: number;
}

export function SupplierMetrics() {
  const [timeRange, setTimeRange] = useState<'14'|'30'|'90'|'all'>('30');
  const [roiRange, setRoiRange] = useState<'2'|'4'|'10'|'all'>('all');

  const { data: metricsData, isLoading } = useQuery<SupplierMetric[]>({
    queryKey: ['supplier-metrics', timeRange, roiRange],
    queryFn: async () => {
      const response = await fetch(`/api/supplier-metrics?days=${timeRange}&loadCount=${roiRange}`);
      if (!response.ok) throw new Error('Failed to fetch supplier metrics');
      const data = await response.json();
      return data.rows || [];
    }
  });

  if (isLoading) {
    return <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-[120px] w-full" />
    </div>;
  }

  const sortedByRoi = Array.isArray(metricsData) ? [...metricsData]
    .filter(m => m.avg_roi > 0)
    .sort((a, b) => b.avg_roi - a.avg_roi)
    .slice(0, 5) : [];

  const sortedByLoadCount = Array.isArray(metricsData) ? [...metricsData]
    .sort((a, b) => b.load_count - a.load_count) : [];

  const totalLoads = sortedByLoadCount.reduce((sum, supplier) => sum + supplier.load_count, 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Suppliers by ROI</CardTitle>
          <Select value={roiRange} onValueChange={(value) => setRoiRange(value as typeof roiRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select loads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Last 2 Loads</SelectItem>
              <SelectItem value="4">Last 4 Loads</SelectItem>
              <SelectItem value="10">Last 10 Loads</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedByRoi.map((supplier) => (
              <div key={supplier.supplier_id} className="flex justify-between items-center">
                <span>{supplier.supplier_name}</span>
                <span>{Number(supplier.avg_roi).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Load Counts</CardTitle>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedByLoadCount.map((supplier) => (
              <div key={supplier.supplier_id} className="flex justify-between items-center">
                <span>{supplier.supplier_name}</span>
                <span>{supplier.load_count} loads</span>
              </div>
            ))}
            <div className="flex justify-between items-center font-bold pt-2 border-t">
              <span>Total Loads</span>
              <span>{totalLoads} loads</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
