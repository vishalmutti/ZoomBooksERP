
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OntarioMetricsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Ontario Warehouse Metrics</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <iframe
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTFBbDbDXphC27IvqHY1OoJNFE7i_J2mP6eoLeXaAHFZmfuaUOTvb5PdypNNwaCatmDUrNTvG4CZMKv/pubchart?oid=525167611&format=interactive"
          frameBorder="0"
          allowFullScreen
          className="w-full h-[600px] rounded-lg shadow-lg"
        />
        <iframe
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQBiDJ9uC5Y2L9KIM9pX7SZDv9P6_r_YaHemcDVa3gYDWVhIOhw9jJ_VB2h2zTW4VTp3NhjIuMFNnnf/pubchart?oid=915905419&format=interactive"
          frameBorder="0"
          allowFullScreen
          className="w-full h-[600px] rounded-lg shadow-lg"
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
