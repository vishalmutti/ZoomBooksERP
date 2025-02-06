import { Invoice } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, AlertCircle, CheckCircle } from "lucide-react";

export default function ARSummary({ invoices }: { invoices: Invoice[] }) {
  const totalAR = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const unpaidAmount = invoices
    .filter(invoice => !invoice.isPaid)
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const paidAmount = totalAR - unpaidAmount;

  const stats = [
    {
      title: "Total AR",
      value: `$${totalAR.toLocaleString()}`,
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: "Outstanding",
      value: `$${unpaidAmount.toLocaleString()}`,
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Collected",
      value: `$${paidAmount.toLocaleString()}`,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="flex items-center p-6">
            <div className={`mr-4 ${stat.color}`}>
              <stat.icon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
