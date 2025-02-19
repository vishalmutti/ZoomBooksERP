
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CarrierSpend {
  carrier: string;
  totalSpend: number;
  loadCount: number;
}

export function CarrierMetrics() {
  const [timeRange, setTimeRange] = useState<'14'|'30'|'90'|'all'>('30');

  const { data: metricsData } = useQuery({
    queryKey: ['carrier-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/carrier-metrics?days=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch carrier metrics');
      return response.json() as Promise<CarrierSpend[]>;
    }
  });

  const sortedBySpend = [...(metricsData || [])].sort((a, b) => b.totalSpend - a.totalSpend);
  const sortedByLoads = [...(metricsData || [])].sort((a, b) => b.loadCount - a.loadCount);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Carrier Metrics</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Carriers by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedBySpend.slice(0, 5).map((carrier, index) => (
                <div key={carrier.carrier} className="flex justify-between items-center">
                  <span>{index + 1}. {carrier.carrier}</span>
                  <span>${Number(carrier.totalSpend).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Carriers by Load Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedByLoads.slice(0, 5).map((carrier, index) => (
                <div key={carrier.carrier} className="flex justify-between items-center">
                  <span>{index + 1}. {carrier.carrier}</span>
                  <span>{carrier.loadCount} loads</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
