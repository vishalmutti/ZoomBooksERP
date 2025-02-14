import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Carrier } from "@shared/schema";

export function CarrierWidget() {
  const { data: carriers = [], isLoading } = useQuery<Carrier[]>({
    queryKey: ["/api/carriers"],
  });

  const activeCarriers = carriers.filter(c => c.status === 'Active');

  if (isLoading) {
    return <div>Loading carrier data...</div>;
  }

  return (
    <Link href="/carriers">
      <Card className="hover:border-primary cursor-pointer">
        <CardHeader>
          <CardTitle>Carrier Portal</CardTitle>
          <CardDescription>Manage carriers and freight loads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{activeCarriers.length}</p>
                <p className="text-sm text-muted-foreground">Active Carriers</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{carriers.length - activeCarriers.length}</p>
                <p className="text-sm text-muted-foreground">Inactive Carriers</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
