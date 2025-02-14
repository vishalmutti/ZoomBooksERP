import { Link } from "wouter";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LoadManagementWidget } from "@/components/LoadManagementWidget";
import { CarrierWidget } from "@/components/carriers/CarrierWidget";

const widgets = [
  {
    title: "Accounts Receivable",
    description: "Manage invoices, track payments, and monitor AR aging",
    path: "/dashboard",
    icon: "💰"
  },
  {
    title: "Payroll",
    description: "Coming soon - Process payroll and manage employee benefits",
    path: "/payroll",
    icon: "👥"
  },
  {
    title: "Inventory",
    description: "Coming soon - Track inventory levels and manage stock",
    path: "/inventory",
    icon: "📦"
  }
];

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Primary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LoadManagementWidget />
        <CarrierWidget />
      </div>

      {/* Secondary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <Link key={widget.title} href={widget.path}>
            <Card className="cursor-pointer hover:border-primary transition-all">
              <CardHeader>
                <div className="text-4xl mb-2">{widget.icon}</div>
                <CardTitle>{widget.title}</CardTitle>
                <CardDescription>{widget.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}