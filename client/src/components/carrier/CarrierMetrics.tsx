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
import { useCarrierContext } from "./CarrierContext";

interface CarrierSpend {
  carrier: string;
  totalSpend: number;
  loadCount: number;
}

type TimeRangeOption = '14' | '30' | '90' | 'all';

export function CarrierMetrics() {
  const { 
    timeRange, 
    setTimeRange, 
    setSelectedCarrier, 
    setActiveTab, 
    setFromMetrics 
  } = useCarrierContext();

  const { data: metricsData = [] } = useQuery({
    queryKey: ['carrier-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/carrier-metrics?days=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch carrier metrics');
      return response.json() as Promise<CarrierSpend[]>;
    }
  });

  const sortedBySpend = [...metricsData].sort((a, b) => b.totalSpend - a.totalSpend);
  const sortedByLoads = [...metricsData].sort((a, b) => b.loadCount - a.loadCount);

  const timeRangeOptions = [
    { value: "14", label: "Last 14 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last 90 Days" },
    { value: "all", label: "All Time" },
  ];

  const handleCarrierClick = (carrier: string) => {
    setSelectedCarrier(carrier);
    setFromMetrics(true);
    setActiveTab("loads");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Carrier Metrics</h2>
        <TimeRangeSelector 
          value={timeRange} 
          onChange={(value) => setTimeRange(value as TimeRangeOption)} 
          options={timeRangeOptions}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <MetricsCard 
          title="Top Carriers by Spend" 
          data={sortedBySpend.slice(0, 5)} 
          renderValue={(carrier) => `$${Number(carrier.totalSpend).toFixed(2)}`}
          onCarrierClick={handleCarrierClick}
        />

        <MetricsCard 
          title="Top Carriers by Load Count" 
          data={sortedByLoads.slice(0, 5)} 
          renderValue={(carrier) => `${carrier.loadCount} loads`}
          onCarrierClick={handleCarrierClick}
        />
      </div>
    </div>
  );
}

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

function TimeRangeSelector({ value, onChange, options }: TimeRangeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select time range" />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface MetricsCardProps {
  title: string;
  data: CarrierSpend[];
  renderValue: (carrier: CarrierSpend) => string;
  onCarrierClick: (carrier: string) => void;
}

function MetricsCard({ title, data, renderValue, onCarrierClick }: MetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((carrier, index) => (
            <div 
              key={carrier.carrier} 
              className="flex justify-between items-center p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
              onClick={() => onCarrierClick(carrier.carrier)}
              title="Click to view underlying data"
            >
              <span>{index + 1}. {carrier.carrier}</span>
              <span>{renderValue(carrier)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
