
import { CarrierTable } from "@/components/carrier/CarrierTable";
import { CarrierList } from "@/components/carrier/CarrierList";
import { CarrierMetrics } from "@/components/carrier/CarrierMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CarrierForm } from "@/components/carrier/CarrierForm";
import { LuPlus } from "react-icons/lu";

export default function CarrierPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Carrier Portal</h1>
      <Tabs defaultValue="loads" className="space-y-8">
        <TabsList>
          <TabsTrigger value="loads">Loads</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="col-span-3">
            <CarrierForm>
              <Button className="w-full">
                <LuPlus className="mr-2 h-4 w-4" /> Add Carrier Loads
              </Button>
            </CarrierForm>
          </div>
          <div className="col-span-1">
            <Button variant="outline" className="w-full">
              Export CSV
            </Button>
          </div>
        </div>

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
