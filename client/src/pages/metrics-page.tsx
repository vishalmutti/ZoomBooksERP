
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MetricsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Key Performance Metrics</h1>
      <Tabs defaultValue="ontario" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ontario">Ontario</TabsTrigger>
          <TabsTrigger value="bc">British Columbia</TabsTrigger>
        </TabsList>

        <TabsContent value="ontario" className="space-y-4">
          <div className="grid gap-4">
            <h2 className="text-2xl font-bold">Ontario Warehouse Metrics</h2>
            {/* Ontario specific metrics will go here */}
            <div className="text-muted-foreground">Coming soon - Ontario metrics dashboard</div>
          </div>
        </TabsContent>

        <TabsContent value="bc" className="space-y-4">
          <div className="grid gap-4">
            <h2 className="text-2xl font-bold">British Columbia Warehouse Metrics</h2>
            {/* BC specific metrics will go here */}
            <div className="text-muted-foreground">Coming soon - British Columbia metrics dashboard</div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
