import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from 'react';

function TableauViz() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://prod-useast-b.online.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js';
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <tableau-viz 
      id='tableau-viz' 
      src='https://prod-useast-b.online.tableau.com/t/amerifoliollc/views/ClientDashboard/Inventory/c3c8146b-6fcc-4526-a983-1e92deadbec2/InventoryDataON' 
      width='100%' 
      height='1940' 
      hide-tabs 
      toolbar='bottom'
    />
  );
}

export default function OntarioMetricsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Ontario Warehouse Metrics</h1>
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Ontario Inventory Metrics</h2>
        <TableauViz />
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">FBA Orders Ontario</h2>
        <tableau-viz 
          id='tableau-viz-fba' 
          src='https://prod-useast-b.online.tableau.com/t/amerifoliollc/views/ClientDashboard/Orders/699e52ae-cb0f-4c1c-968a-6ca1dcd43019/FBAONL6Months' 
          width='100%' 
          height='1940' 
          hide-tabs 
          toolbar='bottom'
        />
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">MF Orders Ontario</h2>
        <tableau-viz 
          id='tableau-viz-orders' 
          src='https://prod-useast-b.online.tableau.com/t/amerifoliollc/views/ClientDashboard/Orders/b68daced-096a-44ca-a948-6e1f56361c2d/MFOrdersON' 
          width='100%' 
          height='1940' 
          hide-tabs 
          toolbar='bottom'
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
        <Link href="/metrics/ontario/storage">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Storage Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Click to view details</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}