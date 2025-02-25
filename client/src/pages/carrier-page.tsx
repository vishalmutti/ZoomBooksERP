import { useEffect } from "react";
import { CarrierTable } from "@/components/carrier/CarrierTable";
import { CarrierList } from "@/components/carrier/CarrierList";
import { CarrierMetrics } from "@/components/carrier/CarrierMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarrierProvider, useCarrierContext } from "@/components/carrier/CarrierContext";

function CarrierPageContent() {
  const { activeTab, setActiveTab, fromMetrics, setFromMetrics, selectedCarrier } = useCarrierContext();
  
  // Effect to reset fromMetrics flag when changing tabs manually
  useEffect(() => {
    if (fromMetrics && activeTab === "metrics") {
      setFromMetrics(false);
    }
  }, [activeTab, fromMetrics, setFromMetrics]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Carrier Portal</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="loads">Loads</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="loads">
          <div className="space-y-8">
            {fromMetrics && selectedCarrier && (
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="text-sm font-medium">
                  Showing loads for carrier: <span className="font-bold">{selectedCarrier}</span>
                </p>
                <button 
                  className="text-sm text-primary hover:underline mt-1"
                  onClick={() => {
                    setFromMetrics(false);
                    setActiveTab("metrics");
                  }}
                >
                  Return to metrics view
                </button>
              </div>
            )}
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

export default function CarrierPage() {
  return (
    <CarrierProvider>
      <CarrierPageContent />
    </CarrierProvider>
  );
}
