
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@shared/schema";

export function WholesaleMetrics() {
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const totalRevenue = invoices.reduce((sum, invoice) => {
    return sum + Number(invoice.totalAmount);
  }, 0);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue (Excluding Freight)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
