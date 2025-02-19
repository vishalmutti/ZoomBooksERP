
import { CarrierTable } from "@/components/carrier/CarrierTable";
import { CarrierList } from "@/components/carrier/CarrierList";
import { CarrierMetrics } from "@/components/carrier/CarrierMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CarrierPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Carrier Portal</h1>
      <Tabs defaultValue="loads" className="space-y-8">
        <TabsList>
          <TabsTrigger value="loads">Loads</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="loads">
          <div className="space-y-8">
            <CarrierTable />
            <CarrierList />
          </div>
        </TabsContent>
        <TabsContent value="metrics">
          <CarrierMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
