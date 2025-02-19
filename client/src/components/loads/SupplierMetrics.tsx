
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface SupplierMetric {
  supplier_id: string;
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
      return response.json();
    }
  });

  const sortedByRoi = metricsData ? [...metricsData].sort((a, b) => b.avg_roi - a.avg_roi) : [];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Supplier Metrics</h2>
        <div className="flex gap-2">
          <Select value={roiRange} onValueChange={(value) => setRoiRange(value as typeof roiRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select ROI range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Last 2 Loads</SelectItem>
              <SelectItem value="4">Last 4 Loads</SelectItem>
              <SelectItem value="10">Last 10 Loads</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers by ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedByRoi.slice(0, 5).map((supplier) => (
                <div key={supplier.supplier_id} className="flex justify-between items-center">
                  <span>{supplier.supplier_id}</span>
                  <span>{Number(supplier.avg_roi).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Load Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedByRoi.slice(0, 5).map((supplier) => (
                <div key={supplier.supplier_id} className="flex justify-between items-center">
                  <span>{supplier.supplier_id}</span>
                  <span>{supplier.load_count} loads</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
