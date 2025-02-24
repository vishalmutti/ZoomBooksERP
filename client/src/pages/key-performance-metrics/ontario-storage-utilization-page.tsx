
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OntarioStorageUtilizationPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Ontario Storage Utilization</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Storage Space</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Coming Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Used Space</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Coming Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available Space</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Coming Soon</p>
          </CardContent>
        </Card>
      </div>
      <div className="w-full">
        <iframe 
          src="https://docs.google.com/spreadsheets/d/1I26GhVusZsMkInB17CwuRZZlEAcBG-3b/edit?usp=sharing&embedded=true"
          className="w-full h-[800px] border-0 rounded-lg shadow-lg"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  );
}
