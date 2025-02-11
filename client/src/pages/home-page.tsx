
import { Link } from "wouter";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const widgets = [
  {
    title: "Accounts Receivable",
    description: "Manage invoices, track payments, and monitor AR aging",
    path: "/dashboard",
    icon: "💰"
  },
  {
    title: "Accounts Payable",
    description: "Coming soon - Manage vendor payments and expenses",
    path: "/ap",
    icon: "📊"
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
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <Link key={widget.title} href={widget.path}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
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
