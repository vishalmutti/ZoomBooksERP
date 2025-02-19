
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
  avg_cost_per_load: number;
}

export function SupplierMetrics() {
  const [loadCountTimeRange, setLoadCountTimeRange] = useState<'14'|'30'|'90'|'all'>('30');
  const [roiRange, setRoiRange] = useState<'2'|'4'|'10'|'all'>('all');
  const [costRange, setCostRange] = useState<'2'|'4'|'10'|'all'>('all');

  const { data: roiMetrics, isLoading: isLoadingRoi } = useQuery<SupplierMetric[]>({
    queryKey: ['supplier-metrics-roi', roiRange],
    queryFn: async () => {
      const response = await fetch(`/api/supplier-metrics?type=roi&roiRange=${roiRange}`);
      if (!response.ok) throw new Error('Failed to fetch supplier ROI metrics');
      const data = await response.json();
      return data.rows || [];
    }
  });

  const { data: costMetrics, isLoading: isLoadingCost } = useQuery<SupplierMetric[]>({
    queryKey: ['supplier-metrics-cost', costRange],
    queryFn: async () => {
      const response = await fetch(`/api/supplier-metrics?type=cost&costRange=${costRange}`);
      if (!response.ok) throw new Error('Failed to fetch supplier cost metrics');
      const data = await response.json();
      return data.rows || [];
    }
  });

  const { data: loadCountMetrics, isLoading: isLoadingLoadCount } = useQuery<SupplierMetric[]>({
    queryKey: ['supplier-metrics-loadcount', loadCountTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/supplier-metrics?days=${loadCountTimeRange}&loadCount=all`);
      if (!response.ok) throw new Error('Failed to fetch supplier load count metrics');
      const data = await response.json();
      return data.rows || [];
    }
  });

  if (isLoadingRoi || isLoadingLoadCount || isLoadingCost) {
    return <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-[120px] w-full" />
    </div>;
  }

  const sortedByRoi = roiMetrics ? [...roiMetrics].sort((a, b) => b.avg_roi - a.avg_roi) : [];
  const sortedByLoadCount = loadCountMetrics ? [...loadCountMetrics].sort((a, b) => b.load_count - a.load_count) : [];
  const sortedByCost = costMetrics ? [...costMetrics].sort((a, b) => (b.avg_cost_per_load || 0) - (a.avg_cost_per_load || 0)) : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
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
              {sortedByRoi.slice(0, 5).map((supplier) => (
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
            <Select value={loadCountTimeRange} onValueChange={(value) => setLoadCountTimeRange(value as typeof loadCountTimeRange)}>
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
              {sortedByLoadCount.slice(0, 5).map((supplier) => (
                <div key={supplier.supplier_id} className="flex justify-between items-center">
                  <span>{supplier.supplier_name}</span>
                  <span>{supplier.load_count} loads</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Average Cost per Load</CardTitle>
            <Select value={costRange} onValueChange={(value) => setCostRange(value as typeof costRange)}>
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
              {sortedByCost.slice(0, 5).map((supplier) => (
                <div key={supplier.supplier_id} className="flex justify-between items-center">
                  <span>{supplier.supplier_name}</span>
                  <span>CAD ${supplier.avg_cost_per_load ? Number(supplier.avg_cost_per_load).toFixed(2) : 'N/A'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
