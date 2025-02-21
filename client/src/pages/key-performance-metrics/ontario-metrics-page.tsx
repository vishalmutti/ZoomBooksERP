
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OntarioMetricsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Ontario Warehouse Metrics</h1>
      <div className="mb-8">
        <iframe
          width="100%"
          height="600"
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTFBbDbDXphC27IvqHY1OoJNFE7i_J2mP6eoLeXaAHFZmfuaUOTvb5PdypNNwaCatmDUrNTvG4CZMKv/pubchart?oid=525167611&format=interactive"
          frameBorder="0"
          allowFullScreen
          className="w-full rounded-lg shadow-lg"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order Fulfillment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Storage Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
